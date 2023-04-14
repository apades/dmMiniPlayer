import DanmakuController, { DanType } from './danmaku'
import Events from './danmaku/events'

export type Props = {
  videoEl: HTMLVideoElement
  /**默认使用400 */
  renderWidth?: number
  renderHeight?: number

  danmu?: Partial<{
    opacity: number
    fontSize: number
    dans: DanType[]
  }>
}

export default class MiniPlayer {
  props: Required<Props>
  videoEl: HTMLVideoElement

  // 弹幕器
  danmaku: DanmakuController
  events = new Events()

  canvas = document.createElement('canvas')
  ctx = this.canvas.getContext('2d')

  animationFrameSignal: number

  /**canvas的captureStream */
  canvasVideoStream: MediaStream
  /**canvas的captureStream放在这里播放 */
  playerVideoEl = document.createElement('video')

  isPause = true

  constructor(props: Props) {
    let {
      renderWidth = 400,
      renderHeight = (renderWidth / 16) * 9,
      danmu = {},
      ...otherProps
    } = props

    danmu = { opacity: 1, fontSize: 28, dans: [], ...danmu }
    this.props = { ...otherProps, renderWidth, renderHeight, danmu }
    this.videoEl = props.videoEl

    this.danmaku = new DanmakuController({
      player: this,
      dans: danmu.dans,
    })

    this.bindVideoElEvents()
    this.updateCanvasSize()
  }

  bindVideoElEvents() {
    let videoEl = this.videoEl

    videoEl.addEventListener('pause', () => (this.isPause = true))
    videoEl.addEventListener('play', () => (this.isPause = false))
    videoEl.addEventListener('loadedmetadata', () => {
      this.props.renderHeight =
        (this.props.renderWidth / videoEl.videoWidth) * videoEl.videoHeight

      this.updateCanvasSize()
    })
  }

  updateCanvasSize() {
    this.canvas.width = this.props.renderWidth
    this.canvas.height = this.props.renderHeight
  }

  getCanvasVideoStream() {
    if (!this.canvasVideoStream)
      this.canvasVideoStream = this.canvas.captureStream()
    return this.canvasVideoStream
  }

  startRenderAsCanvas() {
    try {
      this.animationFrameSignal = requestAnimationFrame(
        this.canvasUpdate.bind(this)
      )
      return true
    } catch (error) {
      return false
    }
  }

  stopRenderAsCanvas() {
    cancelAnimationFrame(this.animationFrameSignal)
  }

  canvasUpdate() {
    const videoEl = this.props.videoEl,
      width = this.props.renderWidth,
      height = this.props.renderHeight

    if (!this.isPause) {
      this.ctx.drawImage(videoEl, 0, 0, width, height)
      this.renderDanmu()
    }

    this.animationFrameSignal = requestAnimationFrame(
      this.canvasUpdate.bind(this)
    )
  }

  renderDanmu() {
    this.danmaku.draw()
  }

  startCanvasPIPPlay() {
    if (!this.playerVideoEl.srcObject) {
      this.playerVideoEl.srcObject = this.getCanvasVideoStream()

      this.playerVideoEl.addEventListener('loadedmetadata', () => {
        this.playerVideoEl.play()
        this.playerVideoEl.requestPictureInPicture()
      })
    }
  }
}
