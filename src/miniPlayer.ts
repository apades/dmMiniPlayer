export type Props = {
  videoEl: HTMLVideoElement
  /**默认使用400 */
  renderWidth?: number
  renderHeight?: number
}

export default class MiniPlayer {
  props: Required<Props>
  videoStream: MediaStream

  canvas = document.createElement('canvas')
  ctx = this.canvas.getContext('2d')
  animationFrameSignal: number

  recorderVideoEl = document.createElement('video')

  constructor(props: Props) {
    const {
      renderWidth = 400,
      renderHeight = (renderWidth / 16) * 9,
      ...otherProps
    } = props
    this.props = { ...otherProps, renderWidth, renderHeight }

    this.props.videoEl.requestPictureInPicture
  }

  getVideoStream() {
    if (!this.videoStream)
      this.videoStream = (this.props.videoEl as any).captureStream()
    return this.videoStream
  }

  startRenderAsCanvas() {
    try {
      this.canvasUpdate()
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
    this.ctx.drawImage(videoEl, 0, 0, width, height)
    this.renderDanmu(videoEl.currentTime)

    this.animationFrameSignal = requestAnimationFrame(this.canvasUpdate)
  }

  // TODO 渲染弹幕
  renderDanmu(time: number) {}
}
