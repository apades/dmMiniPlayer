import { onMessage, sendMessage } from 'webext-bridge/content-script'
import configStore from '@root/store/config'
import {
  createElement,
  dq,
  getDeepPrototype,
  tryCatch,
  wait,
} from '@root/utils'
import { CanvasPIPWebProvider, DocPIPWebProvider, ReplacerWebProvider } from '.'
import {
  CanvasDanmakuEngine,
  DanmakuEngine,
  HtmlDanmakuEngine,
} from '../danmaku/DanmakuEngine'
import SubtitleManager from '../SubtitleManager'
import VideoPlayerBase, {
  ExtendComponent,
} from '../VideoPlayer/VideoPlayerBase'
import DanmakuSender from '../danmaku/DanmakuSender'
import { eventBus, EventBus, PlayerEvent } from '../event'
import { SideSwitcher } from '../SideSwitcher'
import EventSwitcher from '@root/utils/EventSwitcher'
import playerConfig from '@root/store/playerConfig'
import { checkIsLive } from '@root/utils/video'
import { SettingDanmakuEngine } from '@root/store/config/danmaku'
import IronKinokoEngine from '../danmaku/DanmakuEngine/IronKinoko/IronKinokoEngine'
import WebextEvent from '@root/shared/webextEvent'
import { DocPIPRenderType, Position } from '@root/types/config'
import { sendMessage as sendInjectMessage } from '@root/inject/contentSender'
import { VIDEO_ID_ATTR } from '@root/shared/config'

// ? 不知道为什么不能集中一起放这里，而且放这里是3个empty😅
// const FEAT_PROVIDER_LIST = [
//   DocPIPWebProvider,
//   CanvasPIPWebProvider,
//   ReplacerWebProvider,
// ]

export default abstract class WebProvider
  extends EventBus
  implements ExtendComponent
{
  // videoChanger: VideoChanger
  subtitleManager!: SubtitleManager
  danmakuEngine?: DanmakuEngine
  danmakuSender?: DanmakuSender
  sideSwitcher?: SideSwitcher
  isLive?: boolean
  active = false
  isQuickHiding = false
  doNotUsePauseInCloseConfig = false

  private _webVideo?: HTMLVideoElement
  get webVideo() {
    if (!this._webVideo)
      throw new Error('webVideo还没初始化，请用openPlayer()后再调用')
    return this._webVideo
  }
  set webVideo(v: HTMLVideoElement) {
    this._webVideo = v
  }

  miniPlayer!: VideoPlayerBase
  protected MiniPlayer!: typeof VideoPlayerBase

  constructor() {
    super()
    if (
      [DocPIPWebProvider, CanvasPIPWebProvider, ReplacerWebProvider].includes(
        Object.getPrototypeOf(this).constructor,
      )
    )
      return this

    const provider = (() => {
      if (
        (playerConfig.forceDocPIPRenderType ||
          configStore.docPIP_renderType) === DocPIPRenderType.replaceWebVideoDom
      )
        return new ReplacerWebProvider()
      if (configStore.useDocPIP) return new DocPIPWebProvider()
      return new CanvasPIPWebProvider()
    })()

    const rootPrototype =
      getDeepPrototype(this, DocPIPWebProvider) ||
      getDeepPrototype(this, CanvasPIPWebProvider) ||
      getDeepPrototype(this, ReplacerWebProvider) ||
      getDeepPrototype(this, WebProvider)
    Object.setPrototypeOf(rootPrototype, provider)
    return this
  }

  init() {
    this.danmakuEngine = (() => {
      if (configStore.useHtmlDanmaku && configStore.useDocPIP) {
        if (configStore.htmlDanmakuEngine === SettingDanmakuEngine.IronKinoko)
          return new IronKinokoEngine()
        return new HtmlDanmakuEngine()
      }
      return new CanvasDanmakuEngine()
    })()

    this.subtitleManager = new SubtitleManager()

    this.onInit()
    this.active = true
  }
  onInit(): void {}

  /**播放器初始化完毕后触发 */
  onPlayerInitd(): void {}

  protected onUnloadFn: (() => void)[] = []
  protected addOnUnloadFn(fn: () => void) {
    this.onUnloadFn.push(fn)
  }
  unload() {
    console.log('WebProvider unload')
    this.onUnload()
    this.onUnloadFn.forEach((fn) => fn())
    this.onUnloadFn.length = 0
    setTimeout(() => {
      this.active = false
    }, 0)
  }
  onUnload() {
    this.isQuickHiding = false
  }

  /**打开播放器 */
  async openPlayer(props?: { videoEl?: HTMLVideoElement }) {
    if (!navigator.userActivation.isActive) return
    this.init()
    this.webVideo = props?.videoEl ?? this.getVideoEl()

    this.injectVideoEventsListener(this.webVideo)
    this.injectVideoVolumeSetting()

    this.bindCommandsEvent()
    this.isLive ??= checkIsLive(this.webVideo)

    const MiniPlayer = (Object.getPrototypeOf(this) as WebProvider).MiniPlayer
    this.miniPlayer = new MiniPlayer({
      webVideoEl: this.webVideo,
      danmakuEngine: this.danmakuEngine,
      subtitleManager: this.subtitleManager,
      danmakuSender: this.danmakuSender,
      sideSwitcher: this.sideSwitcher,
      isLive: !!this.isLive,
    })

    const unListenVideoChanged = this.on2(
      PlayerEvent.webVideoChanged,
      (newVideoEl) => {
        this.webVideo = newVideoEl
      },
    )

    await this.onOpenPlayer()
    await this.onPlayerInitd()

    sendMessage('PIP-active', { name: 'PIP-active' })

    eventBus.on(PlayerEvent.close, () => {
      this.unload()
      if (configStore.pauseInClose_video && !this.doNotUsePauseInCloseConfig) {
        const video = this.webVideo
        if (!this.isLive) {
          video.pause()
        }
      }

      this.offAll()

      unListenVideoChanged()
      playerConfig.clear()
    })
  }

  // 注入video事件监听器
  injectVideoEventsListener(videoEl: HTMLVideoElement) {
    const eventSwitcher = new EventSwitcher(videoEl)

    this.onUnloadFn.push(
      ...[
        this.on2(PlayerEvent.longTabPlaybackRate, () => {
          eventSwitcher.disable('seeking')
          eventSwitcher.disable('seeked')
        }),
        this.on2(PlayerEvent.longTabPlaybackRateEnd, () => {
          setTimeout(() => {
            eventSwitcher.enable('seeking')
            eventSwitcher.enable('seeked')
          }, 0)
        }),
        eventSwitcher.unload,
      ],
    )
  }

  // Youtube直播的播放器自身记录了volume，每次修改video.volume都会被自动替换
  // https://github.com/apades/dmMiniPlayer/issues/80
  injectVideoVolumeSetting() {
    function injectVolume(vid: string) {
      function getPrototypeGetter<T>(obj: T, key: keyof T) {
        const getter = Object.getOwnPropertyDescriptor(obj, key)?.get

        if (!getter) {
          const prototype = Object.getPrototypeOf(obj)
          if (!prototype) {
            return null
          }
          return getPrototypeGetter(prototype, key)
        }

        return getter
      }
      function getPrototypeSetter<T>(obj: T, key: keyof T) {
        const setter = Object.getOwnPropertyDescriptor(obj, key)?.set

        if (!setter) {
          const prototype = Object.getPrototypeOf(obj)
          if (!prototype) {
            return null
          }
          return getPrototypeSetter(prototype, key)
        }

        return setter
      }

      const video = document.querySelector(
        `video[${VIDEO_ID_ATTR}="${vid}"]`,
      ) as HTMLVideoElement
      const volumeSetter = getPrototypeSetter(video, 'volume')!,
        volumeGetter = getPrototypeGetter(video, 'volume')!

      window.__canSetBySetter = false
      const updateVolume = (volume: number) => {
        if (!window.__canSetBySetter) return
        volumeSetter.call(video, volume)
      }

      Object.defineProperty(video, 'volume', {
        get: volumeGetter,
        set: updateVolume,
      })

      window.__updateVolume = (volume: number) =>
        volumeSetter.call(video, volume)
    }

    sendInjectMessage('run-code', {
      function: injectVolume.toString(),
      args: [this.webVideo.getAttribute(VIDEO_ID_ATTR)],
    })

    this.on(PlayerEvent.volumeUpdate, (volume) => {})
    this.on(PlayerEvent.close, () => {
      function restoreInjectVolume() {
        window.__canSetBySetter = true
      }
      sendInjectMessage('run-code', {
        function: restoreInjectVolume.toString(),
      })
    })
  }

  /**获取视频 */
  getVideoEl(document = window.document): HTMLVideoElement {
    const videos = [
      ...dq('video', document),
      ...dq('iframe', document)
        .map((iframe) => {
          try {
            return Array.from(
              iframe.contentWindow?.document.querySelectorAll('video') ?? [],
            )
          } catch (error) {
            return null
          }
        })
        .filter((v) => !!v)
        .flat(),
    ]

    if (!videos.length)
      throw Error('页面中不存在video，或者video在不支持的非同源iframe中')
    const targetVideo = videos.reduce((tar, now) => {
      if (tar.clientHeight < now.clientHeight) return now
      return tar
    }, videos[0])

    return targetVideo
  }

  onOpenPlayer(): Promise<void> | void {}

  bindCommandsEvent() {
    let lastX = 0,
      lastY = 0,
      lastW = 0,
      lastH = 0,
      lastIsPause = false,
      coverDom = createElement('div', {
        style: {
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999999999,
          backgroundColor: 'black',
        },
      })

    this.addOnUnloadFn(
      onMessage('PIP-action', async (req) => {
        console.log('PIP-action', req)
        if (!this.miniPlayer || !this.webVideo) return
        const videoEl = this.webVideo
        switch ((req?.data as any)?.body) {
          case 'back': {
            videoEl.currentTime -= 5
            break
          }
          case 'forward': {
            videoEl.currentTime += 5
            break
          }
          case 'pause/play': {
            videoEl.paused ? videoEl.play() : videoEl.pause()
            break
          }
          case 'hide': {
            document.body.click()
            if (document.pictureInPictureElement)
              document.exitPictureInPicture()
            if (window.documentPictureInPicture?.window) {
              window.documentPictureInPicture.window.close()
            }
            // TODO 显示的提示
            // document.pictureInPictureElement
            //   ? document.exitPictureInPicture()
            //   : this.startPIPPlay({
            //       onNeedUserClick: () => {
            //         sendToBackground({ name: 'PIP-need-click-notifications' })
            //       },
            //     })
            break
          }
          case 'playbackRate': {
            videoEl.playbackRate == 1
              ? (videoEl.playbackRate = configStore.playbackRate)
              : (videoEl.playbackRate = 1)
            break
          }
          case 'quickHideToggle': {
            if (!window.documentPictureInPicture?.window) return
            // !不能完全隐藏，只能通过其他方式隐藏 Error: Invalid value for bounds. Bounds must be at least 50% within visible screen space.
            const docWin = window.documentPictureInPicture.window
            if (this.isQuickHiding) {
              docWin.document.body.removeChild(coverDom)
              docWin.resizeTo(lastW, lastH)
              if (!lastIsPause) {
                videoEl.play()
              }

              await wait(10)
              await sendMessage(WebextEvent.moveDocPIPPos, {
                x: lastX,
                y: lastY,
                docPIPWidth: docWin.innerWidth,
              })
              this.isQuickHiding = false
            } else {
              lastX = docWin.screenLeft
              lastY = docWin.screenTop
              lastW = docWin.outerWidth
              lastH = docWin.outerHeight
              lastIsPause = videoEl.paused

              this.webVideo.pause()
              docWin.document.body.appendChild(coverDom)
              const screen = docWin.screen

              const minWidth = 240,
                minHeight = 52
              const [left, top] = (() => {
                switch (configStore.quickHide_pos) {
                  case Position.topLeft:
                    return [0, 0]
                  case Position.topRight:
                    return [screen.width - minWidth, 0]
                  case Position.bottomLeft:
                    return [0, screen.height - minHeight]
                  case Position.bottomRight:
                    return [screen.width - minWidth, screen.height - minHeight]
                }
              })()

              await sendMessage(WebextEvent.updateDocPIPRect, {
                left,
                top,
                width: minWidth,
                height: minHeight,
                docPIPWidth: docWin.innerWidth,
              })
              this.isQuickHiding = true
            }
            break
          }
        }
      }),
    )
  }

  close() {}
}
