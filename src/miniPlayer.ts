import DanmakuController, { DanmakuProps } from './danmaku'
import configStore from './store/config'

export type Props = {
  videoEl: HTMLVideoElement
  danmu?: Omit<DanmakuProps, 'player'>
}

export default class MiniPlayer {
  props: Required<Props>
  //
  videoEl: HTMLVideoElement

  // 弹幕器
  danmaku: DanmakuController

  // canvas相关
  canvas = document.createElement('canvas')
  ctx = this.canvas.getContext('2d')

  animationFrameSignal: number

  /**canvas的captureStream */
  canvasVideoStream: MediaStream
  /**canvas的captureStream放在这里播放 */
  playerVideoEl = document.createElement('video')

  isPause = true

  /**在离开画中画时触发 */
  onLeavePictureInPicture: () => void = () => 1

  constructor(props: Props) {
    let { danmu = {}, ...otherProps } = props

    this.props = { ...otherProps, danmu }
    this.videoEl = props.videoEl

    this.danmaku = new DanmakuController({
      player: this,
      ...danmu,
    })

    this.bindVideoElEvents()
    this.updateCanvasSize()
  }

  bindVideoElEvents() {
    let videoEl = this.videoEl

    videoEl.addEventListener('pause', () => (this.isPause = true))
    videoEl.addEventListener('play', () => (this.isPause = false))
    videoEl.addEventListener('loadedmetadata', () => {
      configStore.renderHeight =
        (configStore.renderWidth / videoEl.videoWidth) * videoEl.videoHeight

      this.updateCanvasSize()
    })
  }

  updateCanvasSize() {
    this.canvas.width = configStore.renderWidth
    this.canvas.height = configStore.renderHeight
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
      width = configStore.renderWidth,
      height = configStore.renderHeight

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
        this.playerVideoEl.addEventListener('leavepictureinpicture', () => {
          this.onLeavePictureInPicture()
        })
      })
    }
  }
}
