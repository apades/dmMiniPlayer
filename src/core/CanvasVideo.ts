import { addEventListener } from '@root/utils'
import { onceCallGet } from '@root/utils/decorator'
import { EventBus } from './event'

type Props = {
  videoEl: HTMLVideoElement
  fps?: number
  FPS_limitOffsetAccurate?: boolean
  width?: number
  height?: number
}

export default class CanvasVideo extends EventBus implements Required<Props> {
  videoEl: HTMLVideoElement
  fps = 60
  FPS_limitOffsetAccurate = false
  /**容器高度 */
  height: number = 0
  /**容器宽度 */
  width: number = 0

  canvas = document.createElement('canvas')
  ctx = this.canvas.getContext('2d')!
  private animationFrameSignal: number = 0
  isPause = true
  hasSeek = true

  fpsInterval = 0

  @onceCallGet
  get canvasVideoStream() {
    return this.canvas.captureStream()
  }
  constructor(props: Props) {
    super()
    this.videoEl = props.videoEl
    this.fps = props.fps ?? this.fps
    this.FPS_limitOffsetAccurate =
      props.FPS_limitOffsetAccurate ?? this.FPS_limitOffsetAccurate
    this.width = props.width || props.videoEl.clientWidth
    this.height = props.height || props.videoEl.clientHeight

    // 没有metadata前的video元素宽高是不正常的
    if (this.videoEl.readyState >= 1) {
      this.width = this.videoEl.clientWidth
      this.height = this.videoEl.clientHeight
      this.updateSize()
    }

    // this.width ??= this.videoEl.clientWidth
    // this.height ??= this.videoEl.clientHeight
    // this.updateSize()

    this.bindVideoElEvents()
    this.fpsInterval = 1000 / this.fps

    if (!this.videoEl.paused) {
      this.startRenderAsCanvas()
    }
  }

  protected bindVideoElEvents() {
    let videoEl = this.videoEl

    this.isPause = videoEl.paused

    const clearEventListener = addEventListener(videoEl, (videoEl) => {
      videoEl.addEventListener('pause', () => {
        this.isPause = true
        this.stopRenderAsCanvas()
      })
      videoEl.addEventListener('play', () => {
        this.isPause = false
        this.startRenderAsCanvas()
      })
      videoEl.addEventListener('loadedmetadata', () => {
        this.width = this.videoEl.clientWidth
        this.height = this.videoEl.clientHeight

        this.updateSize()
      })
      videoEl.addEventListener('seeked', () => {
        this.hasSeek = true
      })
    })
    this.clearEventListener = clearEventListener
    this.addCallback(clearEventListener)
  }

  //   containerWidth = 0
  //   containerHeight = 0
  videoWidth = 0
  videoHeight = 0
  x = 0
  y = 0

  /**调整canvas的大小 */
  updateSize(option?: { width: number; height: number }) {
    const { videoEl } = this
    const { height = this.height, width = this.width } = option ?? {}

    this.width = width
    this.height = height

    const conWidthToConRatioHeight =
      (this.width / videoEl.videoWidth) * videoEl.videoHeight

    // 转化比例需要的高度大于目前的高度
    // 转成height为底的模式
    if (conWidthToConRatioHeight > this.height) {
      const conHeightToConRatioWidth =
        (this.height / videoEl.videoHeight) * videoEl.videoWidth

      this.y = 0
      this.x = (this.width - conHeightToConRatioWidth) / 2
      this.videoHeight = this.height
      this.videoWidth = conHeightToConRatioWidth
    }
    // 转成width为底的模式
    else {
      this.x = 0
      this.y = (this.height - conWidthToConRatioHeight) / 2
      this.videoWidth = this.width
      this.videoHeight = conWidthToConRatioHeight
    }

    this.canvas.width = width * window.devicePixelRatio
    this.canvas.height = height * window.devicePixelRatio
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }

  protected clearEventListener() {}

  // 在video play时使用，减少性能消耗
  startRenderAsCanvas() {
    try {
      this.animationFrameSignal = requestAnimationFrame(() =>
        this.frameUpdate()
      )
      return true
    } catch (error) {
      console.error('启动startRenderAsCanvas错误', error)
      return false
    }
  }
  // 在video loading,pause时使用，减少性能消耗
  stopRenderAsCanvas() {
    cancelAnimationFrame(this.animationFrameSignal)
    this.animationFrameSignal = 0
  }

  protected withoutLimitLastUpdateTime = Date.now()
  withoutLimitAnimaFPS = 0
  protected hansDraw = false
  protected frameUpdate(force = false) {
    if (force || (this.fps != 0 ? this.checkFPSLimit() : true)) {
      if (force || !this.isPause || !this.hansDraw) {
        this.hansDraw = true

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.drawCanvas()
        this.detectFPS()
      }
    }
    if (force) return

    const now = Date.now()
    this.performanceInfoLimit(() => {
      const offset = now - this.withoutLimitLastUpdateTime
      this.withoutLimitAnimaFPS = ~~(1000 / offset)
    })
    this.withoutLimitLastUpdateTime = now

    this.inUpdateFrame = false
    this.animationFrameSignal = requestAnimationFrame(() => this.frameUpdate())
  }

  drawCanvas() {
    this.ctx.drawImage(this.videoEl, this.x, this.y, this.width, this.height)
  }

  // TODO 检测视频FPS
  protected lastTime = 0
  protected lastVideo = ''
  /**video的渲染间隔时间计算出的FPS */
  protected animaVideoFPS = 0
  protected detectFPS() {
    let nowTime = this.videoEl.currentTime
    this.performanceInfoLimit(() => {
      if (this.lastTime) this.animaVideoFPS = ~~(1 / (nowTime - this.lastTime))
    })
    this.lastTime = nowTime
  }
  protected lastUpdateTime = Date.now()
  /**设置FPS限制canvasUpdate的requestAnimationFrame下的draw update触发间隔 */
  protected animaFPS = 0
  protected checkFPSLimit() {
    const now = Date.now()
    const offset = now - this.lastUpdateTime
    if (offset > this.fpsInterval) {
      this.performanceInfoLimit(() => {
        this.animaFPS = ~~(1000 / offset)
      })

      if (this.FPS_limitOffsetAccurate) {
        this.lastUpdateTime = now
      } else {
        this.lastUpdateTime = now - (offset % this.fpsInterval) /* now */
      }
      return true
    }
    return false
  }

  protected updateFrame = 0
  protected inUpdateFrame = false
  protected performanceInfoLimit(cb: () => void) {
    if (this.updateFrame++ >= this.fps && !this.inUpdateFrame) {
      this.inUpdateFrame = true
    }

    if (this.inUpdateFrame) {
      cb()
      this.updateFrame = 0
    }
  }
}
