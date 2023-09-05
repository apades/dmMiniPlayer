import { throttle } from 'lodash-es'
import DanmakuController, { type DanmakuProps } from '../danmaku'
import configStore from '../store/config'
import { observe } from 'mobx'
import mitt, { type Emitter } from 'mitt'
import { type PlayerEvents } from './event'
import type { Props as BarrageSenderProps } from './danmaku/BarrageSender'
import { onceCallGet } from '@root/utils/decorator'
import videoRender from '@root/store/videoRender'

export type MiniPlayerProps = {
  videoEl: HTMLVideoElement
  danmu?: Omit<DanmakuProps, 'player'>
}

type EventHandler = Emitter<PlayerEvents>
export default class MiniPlayer {
  props: Required<MiniPlayerProps>
  //
  webPlayerVideoEl: HTMLVideoElement

  // 弹幕器
  danmakuController: DanmakuController

  // canvas相关
  canvas = document.createElement('canvas')
  ctx = this.canvas.getContext('2d')

  animationFrameSignal: number

  /**canvas的captureStream */
  // @onceCallGet
  get canvasVideoStream() {
    return this.canvas.captureStream()
  }

  private eventHandler = mitt<PlayerEvents>()

  /**canvas的captureStream放在这里播放 */
  canvasPlayerVideoEl = document.createElement('video')

  isPause = true
  isLive = false

  constructor(props: MiniPlayerProps) {
    let { danmu = {}, ...otherProps } = props

    this.props = { ...otherProps, danmu }
    this.webPlayerVideoEl = props.videoEl

    this.danmakuController = new DanmakuController({
      player: this,
      ...danmu,
    })

    this.bindVideoElEvents()
    this.updateCanvasSize()
  }

  bindVideoElEvents() {
    let videoEl = this.webPlayerVideoEl

    this.isPause = videoEl.paused
    videoEl.addEventListener('pause', () => {
      this.isPause = true
      this.canvasPlayerVideoEl.pause()
    })
    videoEl.addEventListener('play', () => {
      this.isPause = false
      this.canvasPlayerVideoEl.play()
    })
    videoEl.addEventListener('seeked', () => {
      this.danmakuController.tunnelsMap = {
        bottom: [],
        right: [],
        top: [],
      }
      this.danmakuController.barrages.forEach((b) => {
        b.initd = false
        b.tunnelOuted = false
      })
    })
    videoEl.addEventListener('loadedmetadata', () => {
      this.updateCanvasSize()
    })
  }

  updateCanvasSize(option?: { width: number; height: number }) {
    console.log('update', option)
    videoRender.updateSize(this.webPlayerVideoEl, option)
    this.canvas.width = videoRender.containerWidth
    this.canvas.height = videoRender.containerHeight
  }

  // 在video play时使用，减少性能消耗
  startRenderAsCanvas() {
    try {
      this.animationFrameSignal = requestAnimationFrame(
        this.canvasUpdate.bind(this)
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
    this.animationFrameSignal = null
  }

  protected withoutLimitLastUpdateTime = Date.now()
  withoutLimitAnimaFPS = 0
  private hansDraw = false
  canvasUpdate() {
    if (configStore.renderFPS != 0 ? this.checkFPSLimit() : true) {
      const videoEl = this.props.videoEl

      if (!this.isPause || !this.hansDraw) {
        this.hansDraw = true
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.drawImage(
          videoEl,
          videoRender.x,
          videoRender.y,
          videoRender.videoWidth,
          videoRender.videoHeight
        )
        this.detectFPS()
        this.renderDanmu()
      }
    }

    if (configStore.performanceInfo) {
      this.renderPerformanceInfo()
    }

    let now = Date.now()
    let offset = now - this.withoutLimitLastUpdateTime
    this.performanceInfoLimit(() => {
      this.withoutLimitAnimaFPS = ~~(1000 / offset)
    })
    this.withoutLimitLastUpdateTime = now

    this.inUpdateFrame = false
    this.animationFrameSignal = requestAnimationFrame(
      this.canvasUpdate.bind(this)
    )

    this.renderVideoProgress()
  }

  renderDanmu() {
    this.danmakuController.draw()
  }

  startPIPPlay() {
    if (!this.canvasPlayerVideoEl.srcObject) {
      this.canvasPlayerVideoEl.srcObject = this.canvasVideoStream

      this.canvasPlayerVideoEl.addEventListener('loadedmetadata', () => {
        this.canvasPlayerVideoEl.play()
        this.requestPIP()
        this.canvasPlayerVideoEl.addEventListener(
          'leavepictureinpicture',
          () => {
            this.emit('PIPClose')
          }
        )
      })
    } else {
      this.requestPIP()
    }
  }

  protected requestPIP() {
    this.canvasPlayerVideoEl.requestPictureInPicture().then((pipWindow) => {
      let onResize = () => {
        this.updateCanvasSize({
          width: pipWindow.width,
          height: pipWindow.height,
        })
      }
      onResize()
      pipWindow.addEventListener('resize', throttle(onResize, 500))
    })
  }

  // FIXME 限制的FPS跟实际显示FPS对不上
  private lastUpdateTime = Date.now()
  /**设置FPS限制canvasUpdate的requestAnimationFrame下的draw update触发间隔 */
  animaFPS = 0
  checkFPSLimit() {
    let now = Date.now()
    let offset = now - this.lastUpdateTime
    if (offset > 1000 / configStore.renderFPS) {
      this.performanceInfoLimit(() => {
        this.animaFPS = ~~(1000 / offset)
      })

      this.lastUpdateTime = now - (offset % configStore.renderFPS) /* now */
      return true
    }
    return false
  }

  // TODO 检测视频FPS
  // TODO video seek时lastTime = 0
  private lastTime = 0
  private lastVideo = ''
  /**video的渲染间隔时间计算出的FPS */
  animaVideoFPS = 0

  detectFPS() {
    let nowTime = this.webPlayerVideoEl.currentTime

    this.performanceInfoLimit(() => {
      if (this.lastTime) this.animaVideoFPS = ~~(1 / (nowTime - this.lastTime))
    })

    // const quality = 0.1
    // this.canvas.toDataURL('image/png', quality)

    this.lastTime = nowTime
  }

  updateFrame = 0
  inUpdateFrame = false
  performanceInfoLimit(cb: () => void) {
    if (
      this.updateFrame++ >= configStore.performanceUpdateFrame &&
      !this.inUpdateFrame
    ) {
      this.inUpdateFrame = true
    }

    if (this.inUpdateFrame) {
      cb()
      this.updateFrame = 0
    }
  }

  renderPerformanceInfo() {
    const padding = 4,
      fontSize = 14
    let renderStartY = videoRender.containerHeight + fontSize

    let getY = () => {
      renderStartY = renderStartY - padding - fontSize
      return renderStartY
    }
    let ctx = this.ctx
    ctx.fillStyle = '#fff'
    ctx.font = `600 ${fontSize}px ${configStore.fontFamily}`
    ctx.fillText(
      `withoutLimitAnimaFPS:${this.withoutLimitAnimaFPS}`,
      padding,
      getY()
    )
    ctx.fillText(`animaVideoFPS:${this.animaVideoFPS}`, padding, getY())
    ctx.fillText(`animaFPS:${this.animaFPS}`, padding, getY())
  }

  renderVideoProgress() {
    if (
      !(
        configStore.videoProgress_show &&
        this.webPlayerVideoEl.duration &&
        this.webPlayerVideoEl.duration != Infinity
      )
    )
      return
    let ctx = this.ctx
    let video = this.webPlayerVideoEl
    const height = configStore.videoProgress_height,
      width = (video.currentTime / video.duration) * videoRender.containerWidth
    ctx.fillStyle = configStore.videoProgress_color
    ctx.fillRect(0, videoRender.containerHeight - height, width, height)
  }

  on: EventHandler['on'] = (...args: [any, any]) => {
    // const ev = args[0] as string
    // if (/^wp\:/.test(ev)) {
    //   this.webPlayerVideoEl.addEventListener(ev.replace('wp:', ''), () => {
    //     this.emit(ev as any)
    //   })
    // }
    // if (/^cp\:/.test(ev)) {
    // }
    return this.eventHandler.on(...args)
  }
  off: EventHandler['off'] = function (...args: []) {
    return this.eventHandler.off(...args)
  }
  emit: EventHandler['emit'] = function (...args: []) {
    return this.eventHandler.emit(...args)
  }
  get eventAll() {
    return this.eventHandler.all
  }

  private test_appendCanvasToBody() {
    ;(this.canvas as any).style = 'position:fixed;z-index:1000;top:0;left:0;'
    document.body.appendChild(this.canvas)
  }

  initBarrageSender(props: Omit<BarrageSenderProps, 'textInput'>) {}

  openPlayer() {
    console.log('openPlayer')
    this.startRenderAsCanvas()
    this.bindOnClosePlayer()
    this.startPIPPlay()
  }

  protected bindOnClosePlayer() {
    this.on('PIPClose', () => {
      this.stopRenderAsCanvas()
    })
  }
}
