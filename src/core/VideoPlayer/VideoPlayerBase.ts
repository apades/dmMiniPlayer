import Events2 from '@root/utils/Events2'
import SubtitleManager from '../SubtitleManager'
import { DanmakuEngine } from '../danmaku/DanmakuEngine'
import { PlayerEvent, PlayerEvents } from '../event'
import { PlayerComponent } from '../types'
import { observeVideoEl } from '@root/utils/observeVideoEl'
import DanmakuSender from '../danmaku/DanmakuSender'
import vpConfig from '@root/store/vpConfig'
import { runInAction } from 'mobx'

export type ExtendComponent = {
  subtitleManager: SubtitleManager
  danmakuEngine?: DanmakuEngine
  danmakuSender?: DanmakuSender
}
export type BaseComponent = {
  /**网站的video dom */
  webVideoEl: HTMLVideoElement
}

export type MiniPlayerProps = ExtendComponent & BaseComponent

export default abstract class VideoPlayerBase
  extends Events2<PlayerEvents>
  implements BaseComponent, ExtendComponent, PlayerComponent
{
  webVideoEl: HTMLVideoElement
  subtitleManager: SubtitleManager
  danmakuEngine?: DanmakuEngine
  danmakuSender?: DanmakuSender

  constructor(props: MiniPlayerProps) {
    super()
    this.webVideoEl = props.webVideoEl
    this.subtitleManager = props.subtitleManager
    this.danmakuEngine = props.danmakuEngine
    this.danmakuSender = props.danmakuSender

    this.on(PlayerEvent.close, () => {
      this.unload()
      this.danmakuEngine?.unload()
      this.unobserveVideoElChange()
      vpConfig.reset()
    })
  }

  private unobserveVideoElChange = () => {}
  onUnload() {}
  init() {
    this.onInit()

    this.unobserveVideoElChange = observeVideoEl(
      this.webVideoEl,
      (newVideoEl) => {
        this.emit(PlayerEvent.webVideoChanged, newVideoEl as any)
      }
    )

    runInAction(() => {
      if (this.danmakuSender) {
        vpConfig.canSendDanmaku = true
      }

      if (this.danmakuEngine) {
        vpConfig.canShowDanmaku = true
      }
    })
  }
  unload() {
    this.onUnload()
  }

  onInit() {}

  /**return的函数运行是还原videoEl位置和状态 */
  protected initWebVideoPlayerElState(videoEl: HTMLVideoElement) {
    const originParent = videoEl.parentElement
    if (!originParent) {
      console.error('不正常的video标签，没有父元素', videoEl)
      throw Error('不正常的video标签')
    }

    const originInParentIndex = [...videoEl.parentElement.children].findIndex(
        (child) => child == videoEl
      ),
      hasController = videoEl.controls,
      originStyle = videoEl.getAttribute('style')
    videoEl.controls = false

    return () => {
      videoEl.controls = hasController
      if (!originParent.childNodes[originInParentIndex]) {
        originParent.appendChild(videoEl)
      } else {
        originParent.insertBefore(
          videoEl,
          originParent.childNodes[originInParentIndex]
        )
      }
    }
  }
}
