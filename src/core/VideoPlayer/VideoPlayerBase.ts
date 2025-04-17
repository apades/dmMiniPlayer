import { observeVideoEl } from '@root/utils/observeVideoEl'
import { makeObservable, runInAction } from 'mobx'
import configStore from '@root/store/config'
import playerConfig from '@root/store/playerConfig'
import { DocPIPRenderType } from '@root/types/config'
import {
  createElement,
  getClientRect,
  getVideoElInitFloatButtonData,
} from '@root/utils'
import classNames from 'classnames'
import { getTopParentsWithSameRect } from '@root/utils/dom'
import { SideSwitcher } from '../SideSwitcher'
import SubtitleManager from '../SubtitleManager'
import { DanmakuEngine } from '../danmaku/DanmakuEngine'
import DanmakuSender from '../danmaku/DanmakuSender'
import { EventBus, PlayerEvent } from '../event'
import VideoPreviewManager from '../VideoPreviewManager'

export type ExtendComponent = {
  subtitleManager?: SubtitleManager
  danmakuEngine?: DanmakuEngine
  danmakuSender?: DanmakuSender
  sideSwitcher?: SideSwitcher
  videoPreviewManager?: VideoPreviewManager
  isLive?: boolean
}
export type BaseComponent = {
  /**网站的video dom */
  webVideoEl: HTMLVideoElement
}

export const supportOnVideoChangeTypes = [
  DocPIPRenderType.replaceVideoEl,
  DocPIPRenderType.capture_captureStreamWithCanvas,
  DocPIPRenderType.capture_captureStream,
  DocPIPRenderType.replaceWebVideoDom,
]

export type MiniPlayerProps = ExtendComponent & BaseComponent

export default class VideoPlayerBase
  extends EventBus
  implements BaseComponent, ExtendComponent
{
  webVideoEl: HTMLVideoElement
  subtitleManager?: SubtitleManager
  danmakuEngine?: DanmakuEngine
  danmakuSender?: DanmakuSender
  sideSwitcher?: SideSwitcher
  videoPreviewManager?: VideoPreviewManager
  isLive?: boolean

  canSendDanmaku = false
  canShowDanmaku = false
  showDanmaku = true

  constructor(props: MiniPlayerProps) {
    super()
    this.webVideoEl = props.webVideoEl
    this.subtitleManager = props.subtitleManager
    this.danmakuEngine = props.danmakuEngine
    this.danmakuSender = props.danmakuSender
    this.sideSwitcher = props.sideSwitcher
    this.videoPreviewManager = props.videoPreviewManager
    this.isLive = props.isLive

    makeObservable(this, {
      canSendDanmaku: true,
      canShowDanmaku: true,
      showDanmaku: true,
    })
  }

  reset() {
    runInAction(() => {
      this.canSendDanmaku = false
      this.canShowDanmaku = false
      this.showDanmaku = true
    })
  }

  private unobserveVideoElChange = () => {}
  private unlistenOnClose = () => {}
  protected onUnload() {}
  async init() {
    this.unlistenOnClose = this.on2(PlayerEvent.close, () => {
      console.log('PlayerEvent.close')
      this.unload()
      this.danmakuEngine?.unload()
      this.unobserveVideoElChange()
      this.reset()
    })
    this.emit(PlayerEvent.videoPlayerBeforeInit)

    await this.onInit()

    const renderMode =
      playerConfig.forceDocPIPRenderType || configStore.docPIP_renderType
    const supportOnVideoChange = supportOnVideoChangeTypes.includes(renderMode)

    if (supportOnVideoChange) {
      this.unobserveVideoElChange = observeVideoEl(
        this.webVideoEl,
        (newVideoEl) => {
          this.emit(PlayerEvent.webVideoChanged, newVideoEl as any)
        },
      )
    }

    runInAction(() => {
      if (this.danmakuSender) {
        this.canSendDanmaku = true
      }

      if (this.danmakuEngine) {
        this.canShowDanmaku = true
      }
    })

    this.emit(PlayerEvent.videoPlayerInitd)
  }
  async unload() {
    this.emit(PlayerEvent.videoPlayerBeforeUnload)
    this.unlistenOnClose()
    await this.onUnload()
    this.emit(PlayerEvent.videoPlayerUnloaded)
  }

  protected onInit() {}

  /**return的函数运行是还原videoEl位置和状态 */
  protected initWebVideoPlayerElState(videoEl: HTMLVideoElement) {
    const originParent = videoEl.parentElement
    if (!originParent) {
      console.error('不正常的video标签，没有父元素', videoEl)
      throw Error('不正常的video标签')
    }

    const hasController = videoEl.controls,
      isPause = videoEl.paused

    const style = videoEl.computedStyleMap()
    const isDynamicWH = !![
      style.get('width')?.toString(),
      videoEl.getAttribute('width'),
      style.get('height')?.toString(),
      videoEl.getAttribute('height'),
    ].find((v) => !!v && v.endsWith('px'))
    videoEl.controls = false

    // 随时监听大小变化
    const unListenObserver = (() => {
      if (!isDynamicWH) return () => {}

      const listenTarget = getTopParentsWithSameRect(videoEl).pop() ?? videoEl
      const resizeObserver = new ResizeObserver(() => {
        const { width, height } = listenTarget.getBoundingClientRect()
        occupyEl.style.width = `${width}px`
        occupyEl.style.height = `${height}px`
      })

      resizeObserver.observe(listenTarget)

      return () => {
        resizeObserver.disconnect()
      }
    })()

    const [, , fixedPos] = getVideoElInitFloatButtonData(videoEl)

    const { width, height } = videoEl.getBoundingClientRect()
    const occupyEl = createElement('div', {
      style: {
        ...(fixedPos || isDynamicWH
          ? { width, height }
          : {
              width: '100%',
              height: '100%',
            }),
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '14px',
      },
      innerText: '正在以画中画模式播放中，点击可还原播放器',
      onclick: () => {
        console.log('click close`')
        this.emit(PlayerEvent.close)
      },
    })
    occupyEl.style.background = 'black'
    occupyEl.style.color = 'white'

    // FIXME 有时候会出现替换一瞬间，又替换回去的情况，然后docPIP的播放器就卡状态了
    originParent.replaceChild(occupyEl, videoEl)

    // replaceChild触发后会被暂停视频
    setTimeout(() => {
      if (!isPause && videoEl.paused) {
        videoEl.play()
      }
    }, 0)

    return () => {
      videoEl.controls = hasController

      originParent.replaceChild(videoEl, occupyEl)
      unListenObserver()
      // if (!originParent.childNodes[originInParentIndex]) {
      //   originParent.appendChild(videoEl)
      // } else {
      //   originParent.insertBefore(
      //     videoEl,
      //     originParent.childNodes[originInParentIndex],
      //   )
      // }
    }
  }
}
