import { throttle } from 'lodash-es'
import DanmakuController, { DanmakuProps } from './danmaku'
import configStore from './store/config'
import { observe } from 'mobx'
import {
  addCusData,
  sendPerformanceData,
  timeEnd,
  timeStart,
} from './utils/performance'

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

  // TODO 全局按键用来暂停播放，隐藏pip窗口
  bindVideoElEvents() {
    let videoEl = this.videoEl

    this.isPause = videoEl.paused
    videoEl.addEventListener('pause', () => (this.isPause = true))
    videoEl.addEventListener('play', () => (this.isPause = false))
    videoEl.addEventListener('loadedmetadata', () => {
      configStore.renderHeight =
        (configStore.renderWidth / videoEl.videoWidth) * videoEl.videoHeight

      this.updateCanvasSize()
    })

    // observe(configStore, 'renderWidth', () => {
    //   console.log('update width')
    //   this.updateCanvasSize()
    //   this.canvasUpdate(true)
    // })
    // observe(configStore, 'renderHeight', () => {
    //   console.log('update height')
    //   this.updateCanvasSize()
    //   this.canvasUpdate(true)
    // })
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

  // 在video play时使用，减少性能消耗
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

  // 在video loading,pause时使用，减少性能消耗
  stopRenderAsCanvas() {
    cancelAnimationFrame(this.animationFrameSignal)
    this.animationFrameSignal = null
  }

  private withoutLimitLastUpdateTime = Date.now()
  withoutLimitAnimaFPS = 0
  canvasUpdate() {
    const videoEl = this.props.videoEl,
      width = configStore.renderWidth,
      height = configStore.renderHeight

    const canUpdateImage =
      (configStore.renderFPS != 0 ? this.checkFPSLimit() : true) &&
      !this.isPause

    timeStart('drawImage')
    if (canUpdateImage) this.ctx.drawImage(videoEl, 0, 0, width, height)
    timeEnd('drawImage', { isUpdate: canUpdateImage })
    if (canUpdateImage) this.detectFPS()
    timeStart('绘制弹幕')
    if (canUpdateImage) this.renderDanmu()
    timeEnd('绘制弹幕', { isUpdate: canUpdateImage })

    if (configStore.performanceInfo) {
      this.renderPerformanceInfo()
    }

    let now = Date.now()
    let offset = now - this.withoutLimitLastUpdateTime
    // this.withoutLimitAnimaFPS = ~~(1000 / offset)
    addCusData('无限制FPS', ~~(1000 / offset))
    this.performanceInfoLimit(() => {
      this.withoutLimitAnimaFPS = ~~(1000 / offset)
    })
    this.withoutLimitLastUpdateTime = now

    timeStart('绘制进度条')
    this.renderVideoProgress()
    timeEnd('绘制进度条')
    sendPerformanceData()

    this.inUpdateFrame = false
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
        this.startPlayerElPIPPlay()
        this.playerVideoEl.addEventListener('leavepictureinpicture', () => {
          this.onLeavePictureInPicture()
        })
      })
    } else {
      this.startPlayerElPIPPlay()
    }
  }

  startPlayerElPIPPlay() {
    this.playerVideoEl.requestPictureInPicture().then((pipWindow) => {
      let onResize = () => {
        if (configStore.autoResizeInPIP) {
          configStore.setRatioWidth(this.videoEl, {
            renderWidth: pipWindow.width,
          })
          this.updateCanvasSize()
        }
      }
      onResize()
      pipWindow.onresize = throttle(onResize, 500)
    })
  }

  // FIXME 限制的FPS跟实际显示FPS对不上
  private lastUpdateTime = Date.now()
  /**设置FPS限制canvasUpdate的requestAnimationFrame下的draw update触发间隔 */
  animaFPS = 0
  checkFPSLimit() {
    let now = Date.now()
    let offset = now - this.lastUpdateTime
    timeStart('限制的FPS')
    if (offset > 1000 / configStore.renderFPS) {
      this.performanceInfoLimit(() => {
        this.animaFPS = ~~(1000 / offset)
      })

      this.lastUpdateTime = now - (offset % configStore.renderFPS) /* now */
      timeEnd('限制的FPS')
      return true
    }
    timeEnd('限制的FPS', { isUpdate: false })
    return false
  }

  // TODO 检测视频FPS
  // TODO video seek时lastTime = 0
  private lastTime = 0
  private lastVideo = ''
  /**video的渲染间隔时间计算出的FPS */
  animaVideoFPS = 0

  detectFPS() {
    let nowTime = this.videoEl.currentTime

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
    let renderStartY = configStore.renderHeight + fontSize

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
        this.videoEl.duration &&
        this.videoEl.duration != Infinity
      )
    )
      return
    let ctx = this.ctx
    let video = this.videoEl
    const height = configStore.videoProgress_height,
      width = (video.currentTime / video.duration) * configStore.renderWidth
    ctx.fillStyle = configStore.videoProgress_color
    ctx.fillRect(0, configStore.renderHeight - height, width, height)
  }
}
