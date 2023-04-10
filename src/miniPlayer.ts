import DanmakuController from './danmaku'
import Events from './danmaku/events'

export type Props = {
  videoEl: HTMLVideoElement
  /**默认使用400 */
  renderWidth?: number
  renderHeight?: number

  danmu?: Partial<{
    opacity: number
    height: number
  }>
}

export default class MiniPlayer {
  props: Required<Props>
  videoEl: HTMLVideoElement
  videoStream: MediaStream

  // 弹幕器
  danmaku: DanmakuController
  events = new Events()

  canvas = document.createElement('canvas')
  ctx = this.canvas.getContext('2d')
  animationFrameSignal: number

  recorderVideoEl = document.createElement('video')

  constructor(props: Props) {
    let {
      renderWidth = 400,
      renderHeight = (renderWidth / 16) * 9,
      danmu = {},
      ...otherProps
    } = props
    // TODO 实际比例
    // let {
    //   renderWidth = 400,
    //   renderHeight = (renderWidth / props.videoEl.videoWidth) *
    //     props.videoEl.videoHeight,
    //   danmu = {},
    //   ...otherProps
    // } = props

    danmu = { opacity: 1, height: 28, ...danmu }
    this.props = { ...otherProps, renderWidth, renderHeight, danmu }
    this.videoEl = props.videoEl

    this.danmaku = new DanmakuController({
      player: this,
      // container: this.template.danmaku,
      container: { width: renderWidth, height: renderHeight },
      opacity: this.props.danmu.opacity,
      callback: () => {
        // setTimeout(() => {
        //   this.template.danmakuLoading.style.display = 'none'

        //   // autoplay
        //   if (this.options.autoplay) {
        //     this.play()
        //   }
        // }, 0)
        console.log('callback')
      },
      error: (msg: string) => {
        console.error(msg)
        // this.notice(msg)
      },
      // apiBackend: this.options.apiBackend,
      // borderColor: this.options.theme,
      borderColor: 'transparent',
      height: this.props.danmu.height,
      time: () => this.props.videoEl.currentTime,
      unlimited: false,
      // api: {
      //   id: this.options.danmaku.id,
      //   address: this.options.danmaku.api,
      //   token: this.options.danmaku.token,
      //   maximum: this.options.danmaku.maximum,
      //   addition: this.options.danmaku.addition,
      //   user: this.options.danmaku.user,
      //   speedRate: this.options.danmaku.speedRate,
      // },
      events: this.events,
      tran: (msg: string) => msg,
    })
  }

  getVideoStream() {
    if (!this.videoStream)
      this.videoStream = (this.props.videoEl as any).captureStream()
    return this.videoStream
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
    this.ctx.drawImage(videoEl, 0, 0, width, height)
    this.renderDanmu(videoEl.currentTime)

    this.animationFrameSignal = requestAnimationFrame(
      this.canvasUpdate.bind(this)
    )
  }

  // TODO 渲染弹幕
  renderDanmu(time: number) {}
}
