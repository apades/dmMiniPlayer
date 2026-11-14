import { HtmlDanmakuProvider } from '@root/core/WebProvider'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { dq, dq1, switchLatest, tryCatch } from '@root/utils'
import { SideSwitcher } from '@root/core/SideSwitcher'
import { VideoItem } from '@root/components/VideoPlayer/Side'
import API_bilibili from '@root/api/bilibili'
import { t } from '@root/utils/i18n'
import { getVideoInfoFromUrl } from '@pkgs/danmakuGetter/apiDanmaku/bilibili/BilibiliVideo'
import { sendMessage } from '@root/inject/contentSender'
import configStore, { saveConfig, updateConfig } from '@root/store/config'
import { BiliDanmakuMode } from '@root/store/config/specialWebsites'
import { autorun } from 'mobx'
import { PlayerEvent } from '@root/core/event'
import { getDanmakus } from '../utils'
import {
  toastBiliDanmakuLoadError,
  toastBiliDanmakuMode,
} from '../danmakuLoadToast'
import BiliBiliPreviewManager from './PreviewManager'
import BilibiliSubtitleManager from './SubtitleManager'

type RecommendVideo = {
  el: HTMLElement
  linkEl: HTMLElement
  link: string
  cover: string
  title: string
  user: string
  played: number
  duration: number
  bvid: string
  danmaku: number
}

export default class BilibiliVideoProvider extends HtmlDanmakuProvider {
  private originDanmakuMode = BiliDanmakuMode.api

  override onInit(): void {
    this.originDanmakuMode = configStore.biliVideoDanmakuMode
    this.subtitleManager = new BilibiliSubtitleManager()
    // danmakuSender
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender.setData(this.getDanmakuSenderConfig())
    // sideSwitcher
    this.sideSwitcher = new SideSwitcher()
    this.videoPreviewManager = new BiliBiliPreviewManager()

    this.on2(PlayerEvent.seeking, this.onSeeked)
    // sendMessage('event-hacker:disable', {
    //   qs: 'document',
    //   event: 'visibilitychange',
    // })

    function fn() {
      function getDeeperGetter(obj: any, key: string) {
        if (!obj) return undefined
        const val = Object.getOwnPropertyDescriptor(obj, key)
        if (val && val.get) return val.get
        return getDeeperGetter(Object.getPrototypeOf(obj), key)
      }

      try {
        // 还原document的getter
        const originGetter = getDeeperGetter(document, 'visibilityState')
        window.__restoreDocumentVisibilityStateGetter = () => {
          Object.defineProperty(document, 'visibilityState', {
            get: originGetter,
          })
        }
      } catch (error) {
        console.error('没法设置还原document.visibilityState的getter', error)
      }

      try {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get() {
            return 'visible'
          },
        })
      } catch (error) {
        console.error('没法注入document.visibilityState的getter', error)
      }
    }
    sendMessage('run-code', { function: fn.toString() })
  }

  private onSeeked = () => {
    if (configStore.biliVideoDanmakuMode !== BiliDanmakuMode.html) return
    this.danmakuEngine?.resetState?.()
  }

  private lastAid = ''
  private lastCid = ''

  override async onPlayerInitd() {
    this.update()

    this.addOnUnloadFn(
      onRouteChange(() => {
        this.update()
      }),
    )

    function fn() {
      document.dispatchEvent(new Event('visibilitychange'))
    }
    sendMessage('run-code', { function: fn.toString() })
  }

  override onUnload(): void {
    this.clearUpdateAutorun()
    this.stopObserveHtmlDanmaku()
    this.isQuickHiding = false
    // sendMessage('event-hacker:enable', {
    //   qs: 'document',
    //   event: 'visibilitychange',
    // })

    function fn() {
      if (window.__restoreDocumentVisibilityStateGetter) {
        window.__restoreDocumentVisibilityStateGetter()
      } else {
        console.error('没有找到window.__restoreDocumentVisibilityStateGetter')
      }
    }
    sendMessage('run-code', { function: fn.toString() })
  }

  private clearUpdateAutorun = () => {}
  update() {
    this.clearUpdateAutorun()
    this.clearUpdateAutorun = autorun(() => {
      const mode = configStore.biliVideoDanmakuMode
      if (mode !== this.originDanmakuMode) {
        this.originDanmakuMode = mode
        toastBiliDanmakuMode(mode)
      }
      this.initDanmakus()
    })

    this.subtitleManager.init(this.webVideo)
    this.initSideSwitcherData()
    this.videoPreviewManager?.init(this.webVideo)
  }

  getDanmakus = switchLatest(async () => {
    const { aid, cid } = await getVideoInfoFromUrl(location.href)

    const danmakus = await getDanmakus(aid, cid)
    return danmakus
  })
  async initDanmakus() {
    this.danmakuEngine?.resetState()
    this.stopObserveHtmlDanmaku()

    switch (configStore.biliVideoDanmakuMode) {
      case BiliDanmakuMode.html:
        this.startObserveHtmlDanmaku(this.getObserveHtmlDanmakuConfig())
        break
      case BiliDanmakuMode.api:
        const [err, danmakus] = await tryCatch(() => this.getDanmakus())
        if (err) {
          toastBiliDanmakuLoadError(() => this.switchToHtmlDanmaku())
        } else {
          this.danmakuEngine?.setDanmakus(danmakus)
        }
        break
    }
  }

  private switchToHtmlDanmaku() {
    updateConfig({ biliVideoDanmakuMode: BiliDanmakuMode.html })
    saveConfig()
  }

  /**
   * Bilibili video reuses danmaku nodes: it toggles the show class and
   * replaces the text instead of appending a new element.
   */
  override startObserveHtmlDanmaku(
    props: Parameters<HtmlDanmakuProvider['startObserveHtmlDanmaku']>[0],
  ) {
    if (!props.container) return
    this.stopObserveHtmlDanmaku()
    const lastText = new WeakMap<HTMLElement, string>()

    const emitNode = (node: HTMLElement) => {
      if (!(props.isDanmu?.(node) ?? true)) {
        lastText.delete(node)
        return
      }
      const text =
        typeof props.text === 'function'
          ? props.text(node)?.textContent
          : dq1(props.text, node)?.textContent
      if (!text || lastText.get(node) === text) return
      lastText.set(node, text)
      this.danmakuEngine?.addDanmakus([
        {
          text,
          type: 'right',
          color: node.style.getPropertyValue('--color') || '#fff',
        },
      ])
    }
    const resolveDanmakuEl = (target: Node) => {
      const el = target instanceof HTMLElement ? target : target.parentElement
      if (!el) return
      if (el.matches(props.child)) return el
      return el.closest(props.child) as HTMLElement | null
    }

    const observer = new MutationObserver((list) => {
      const nodes = new Set<HTMLElement>()
      list.forEach((record) => {
        if (record.type === 'childList') {
          record.addedNodes.forEach((added) => {
            if (!(added instanceof HTMLElement)) return
            if (added.matches(props.child)) nodes.add(added)
            else {
              added.querySelectorAll(props.child).forEach((el) => {
                nodes.add(el as HTMLElement)
              })
            }
          })
          return
        }
        const danmakuEl = resolveDanmakuEl(record.target)
        if (danmakuEl) nodes.add(danmakuEl)
      })
      nodes.forEach((node) => emitNode(node))
    })
    props.container.querySelectorAll(props.child).forEach((el) => {
      emitNode(el as HTMLElement)
    })
    observer.observe(props.container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      characterData: true,
    })
    this.htmlDanmakuObserver = observer
  }

  override getObserveHtmlDanmakuConfig(): Parameters<
    (typeof this)['startObserveHtmlDanmaku']
  >[0] {
    const container =
      dq1<HTMLElement>('.bpx-player-row-dm-wrap') ||
      dq1<HTMLElement>('.bilibili-player-video-danmaku')
    return {
      container: container!,
      child: '.bili-danmaku-x-dm',
      text: (child) => dq1('.bili-danmaku-x-high-text', child) || child,
      isDanmu: (node) => node.classList.contains('bili-danmaku-x-show'),
    }
  }

  getDanmakuSenderConfig() {
    return {
      webTextInput: dq1<HTMLInputElement>('.bpx-player-dm-input'),
      webSendButton: dq1<HTMLElement>('.bpx-player-dm-btn-send'),
    }
  }

  // ! 已知他用的top，目前没有iframe跳转方案了；需要切换成video url方案了https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/videostream_url.md
  async initSideSwitcherData() {
    if (!this.sideSwitcher) {
      console.error('已经被unload了', this)
      throw Error('已经被unload了')
    }

    const getCtxDocument = () => document
    /**获取视频分p列表 */
    const getVideoPElList = () => {
      const list = [
        () => dq('.video-episode-card', getCtxDocument()),
        // https://www.bilibili.com/video/BV1Yh4y1j7ko 用的这个，是不是瓦比赛那套改了不得而知
        () => dq('.list-box li .clickitem', getCtxDocument()),
        // 新网页的选择器
        () =>
          dq('.video-pod__item .simple-base-item:not(.head)', getCtxDocument()),
        // 还有这种😅
        () =>
          dq('.video-pod__item.simple-base-item:not(.head)', getCtxDocument()),
        // 目前看到瓦的比赛视频分p用的这个
        () => dq('.list-box li a', getCtxDocument()),
        // /list/*用的这个
        () => dq('.action-list-item .actionlist-item-inner', getCtxDocument()),
      ]

      return list.find((fn) => fn().length)?.() || []
    }

    /**分p视频active */
    const isVideoPActive = (el: HTMLElement) =>
      !!(
        el.querySelector('.video-episode-card__info-playing') ||
        el.querySelector('.video-episode-card__info-title-playing') ||
        el.classList.contains('on') ||
        el.classList.contains('active') ||
        el.classList.contains('siglep-active')
      )

    // 视频分p
    const videoPElList = getVideoPElList()
    const videoPItems: VideoItem[] = videoPElList.map((el) => {
      return {
        el,
        link: '',
        linkEl: el,
        title:
          el.querySelector('.video-episode-card__info-title')?.textContent ??
          el.querySelector('.title')?.textContent ??
          el.textContent?.trim() ??
          '',
        isActive: isVideoPActive(el),
        cover: dq1<HTMLImageElement>('.cover img', el)?.src,
      }
    })

    async function getRecommendVideos() {
      const relateVideos = await API_bilibili.getRelateVideos(
        (await getVideoInfoFromUrl(location.href)).aid,
      )
      const recommendElList = dq('.video-page-card-small')

      if (!relateVideos) throw Error('没法获取关联视频')
      const recommendVideos: RecommendVideo[] = []

      recommendElList.forEach((el) => {
        const elAEl = el.querySelector<HTMLAnchorElement>('.info a')
        if (!elAEl) return

        const linkEl = elAEl.children[0] as HTMLElement,
          elBvid = elAEl.href.match(/\/video\/(BV.*)\//)?.[1]

        if (!linkEl || !elBvid) return

        const i = relateVideos.findIndex((v: any) => v.bvid == elBvid)
        const relate = relateVideos.splice(i, 1)[0]

        recommendVideos.push({
          cover: relate.pic,
          duration: relate.duration,
          // 下面3个对应在网站上的
          el,
          link: `/video/${elBvid}`,
          linkEl,
          played: relate.stat.view,
          title: relate.title,
          user: relate.owner.name,
          bvid: elBvid,
          danmaku: relate.stat.danmaku,
        })
      })

      return recommendVideos
    }

    this.sideSwitcher.init([
      {
        category: t('vp.playList'),
        items: videoPItems,
        mainList: true,
      },
      {
        category: t('vp.recommendedList'),
        items: (await getRecommendVideos()).map((v) => ({ ...v, id: v.bvid })),
      },
    ])
  }
}
