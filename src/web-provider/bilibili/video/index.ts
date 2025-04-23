import { WebProvider } from '@root/core/WebProvider'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { dq, dq1, switchLatest, tryCatch } from '@root/utils'
import { SideSwitcher } from '@root/core/SideSwitcher'
import { VideoItem } from '@root/components/VideoPlayer/Side'
import API_bilibili from '@root/api/bilibili'
import { t } from '@root/utils/i18n'
import { getVideoInfoFromUrl } from '@pkgs/danmakuGetter/apiDanmaku/bilibili/BilibiliVideo'
import toast from 'react-hot-toast'
import { getDanmakus } from '../utils'
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

export default class BilibiliVideoProvider extends WebProvider {
  onInit(): void {
    this.subtitleManager = new BilibiliSubtitleManager()
    // danmakuSender
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender.setData({
      webTextInput: dq1<HTMLInputElement>('.bpx-player-dm-input'),
      webSendButton: dq1<HTMLElement>('.bpx-player-dm-btn-send'),
    })
    // sideSwitcher
    this.sideSwitcher = new SideSwitcher()
    this.videoPreviewManager = new BiliBiliPreviewManager()
  }

  private lastAid = ''
  private lastCid = ''

  async onPlayerInitd() {
    this.update()

    this.addOnUnloadFn(
      onRouteChange(() => {
        this.update()
      }),
    )
  }

  update() {
    this.initDanmakus()
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
    const [err, danmakus] = await tryCatch(() => this.getDanmakus())

    if (err) {
      toast.error(t('error.danmakuLoad'))
    } else {
      this.danmakuEngine?.setDanmakus(danmakus)
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
        () => dq('.video-pod__item .simple-base-item', getCtxDocument()),
        // 还有这种😅
        () => dq('.video-pod__item.simple-base-item', getCtxDocument()),
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
