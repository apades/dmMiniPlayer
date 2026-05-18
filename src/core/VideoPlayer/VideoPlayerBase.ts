import { DocPIPRenderType } from '@root/types/config'
import { observeVideoEl } from '@root/utils/observeVideoEl'
import { WebProvider } from '../WebProvider'
import { EventBus, PlayerEvent } from '../event'
import { PlayerComponents } from '../player-component'

export type ExtendComponent = {
  playerComponents: PlayerComponents
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
  playerComponents!: PlayerComponents
  webVideoEl: HTMLVideoElement
  isLive?: boolean

  config!: WebProvider['config']

  constructor(props: MiniPlayerProps) {
    super()
    this.webVideoEl = props.webVideoEl
    this.isLive = props.isLive
    this.playerComponents = props.playerComponents
  }

  reset() {}

  private unobserveVideoElChange = () => {}
  private unlistenOnClose = () => {}
  protected onUnload() {}

  private src = ''
  async init(config: WebProvider['config']) {
    this.config = config
    this.unlistenOnClose = this.on2(PlayerEvent.close, () => {
      console.log('PlayerEvent.close')
      this.unload()
      this.unobserveVideoElChange()
      this.reset()
    })
    this.emit(PlayerEvent.videoPlayerBeforeInit)

    await this.onInit()

    const renderMode = this.config.renderType
    const supportOnVideoChange = supportOnVideoChangeTypes.includes(renderMode)

    if (supportOnVideoChange) {
      this.unobserveVideoElChange = observeVideoEl(
        this.webVideoEl,
        (newVideoEl) => {
          this.emit(PlayerEvent.webVideoChanged, newVideoEl as any)
          this.emit(PlayerEvent.mediaUpdated)
        },
      )
    }

    this.src = this.webVideoEl.src

    this.webVideoEl.addEventListener('loadedmetadata', () => {
      if (this.src !== this.webVideoEl.src) {
        this.src = this.webVideoEl.src
        this.emit(PlayerEvent.videoSrcChanged)
        this.emit(PlayerEvent.mediaUpdated)
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

    const originInParentIndex = [...videoEl.parentElement.children].findIndex(
        (child) => child == videoEl,
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
          originParent.childNodes[originInParentIndex],
        )
      }
    }
  }
}
