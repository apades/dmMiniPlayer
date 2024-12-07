import { onMessage, sendMessage } from 'webext-bridge/content-script'
import configStore, { DocPIPRenderType } from '@root/store/config'
import { createElement, dq, getDeepPrototype } from '@root/utils'
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
import { EventBus, PlayerEvent } from '../event'
import { SideSwitcher } from '../SideSwitcher'
import { checkIsLive } from '@root/utils/video'
import EventSwitcher from '@root/utils/EventSwitcher'

// ? 不知道为什么不能集中一起放这里，而且放这里是3个empty😅
const FEAT_PROVIDER_LIST = [
  DocPIPWebProvider,
  CanvasPIPWebProvider,
  ReplacerWebProvider,
]

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
        Object.getPrototypeOf(this).constructor
      )
    )
      return this

    const provider = (() => {
      if (configStore.docPIP_renderType === DocPIPRenderType.replaceWebVideoDom)
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
    this.danmakuEngine =
      configStore.useHtmlDanmaku && configStore.useDocPIP
        ? new HtmlDanmakuEngine()
        : new CanvasDanmakuEngine()

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
  onUnload() {}

  /**打开播放器 */
  async openPlayer(props?: { videoEl?: HTMLVideoElement }) {
    if (!navigator.userActivation.isActive) return
    this.init()
    this.webVideo = props?.videoEl ?? this.getVideoEl()
    this.injectVideoEventsListener(this.webVideo)
    this.bindCommandsEvent()

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
      }
    )

    await this.onOpenPlayer()
    await this.onPlayerInitd()

    sendMessage('PIP-active', { name: 'PIP-active' })

    const unListenOnClose = this.miniPlayer.on2(PlayerEvent.close, () => {
      this.unload()
      if (configStore.pauseInClose_video) {
        const video = this.webVideo
        const isLive = checkIsLive(video)
        if (configStore.pauseInClose_live || !isLive) {
          video.pause()
        }
      }

      this.offAll()

      unListenOnClose()
      unListenVideoChanged()
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
      ]
    )
  }

  /**获取视频 */
  getVideoEl(document = window.document): HTMLVideoElement {
    const videos = [
      ...dq('video', document),
      ...dq('iframe', document)
        .map((iframe) => {
          try {
            return Array.from(
              iframe.contentWindow?.document.querySelectorAll('video') ?? []
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
    this.addOnUnloadFn(
      onMessage('PIP-action', (req) => {
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
        }
      })
    )
  }
}
