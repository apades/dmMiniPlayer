import { autorun } from 'mobx'
import { getTextWidth, noop } from '@root/utils'
import { DanmakuBase } from '../'
import type { DanmakuInitProps } from '../DanmakuBase'
import CanvasDanmakuEngine from './CanvasDanmakuEngine'

export default class CanvasDanmaku extends DanmakuBase {
  declare danmakuEngine: CanvasDanmakuEngine

  // 渲染的x,y
  x = 0
  y = 0

  /**移动了的x */
  moveX = 0

  startTime = 0
  endTime = 0

  tunnelOuted = false

  drawSuccess = false

  override get speed() {
    return super.speed / 10
  }

  constructor(props: ConstructorParameters<typeof DanmakuBase>[0]) {
    super(props)
    this.startTime = this.time
  }
  override onInit(props: DanmakuInitProps): void {
    if (this.initd) return
    this.tunnel = this.danmakuEngine.tunnelManager.getTunnel(this)
    if (this.tunnel == -1) {
      this.disabled = true
      return
    }

    if (this.type != 'right') {
      this.autorun(() => {
        this.endTime =
          this.startTime + this.danmakuEngine.unmovingDanmakuSaveTime
      })
    } else {
      // ! 加个保底的time，不然跳到后段时需要计算太多的前面的弹幕位置了
      this.endTime = this.startTime + 30
    }

    const canvas = this.danmakuEngine.canvas

    this.autorun(() => {
      this.width = getTextWidth(this.text, {
        fontSize: this.danmakuEngine.fontSize + 'px',
        fontFamily: this.danmakuEngine.fontFamily,
        fontWeight: this.danmakuEngine.fontWeight,
      })
      if (this.type != 'right') {
        this.x = (canvas.width - this.width) / 2
      }
    })

    if (this.type != 'right') {
      this.autorun(() => {
        this.x = (canvas.width - this.width) / 2 / window.devicePixelRatio
      })
    } else {
      this.x = canvas.width
      const time = props.initTime
      if (time) {
        const offsetTime = time - this.startTime
        this.moveX =
          offsetTime *
          (this.danmakuEngine.renderFPS ||
            this.danmakuEngine.withoutLimitAnimaFPS ||
            60) *
          this.speed
      } else {
        this.moveX = 0
      }
    }

    this.initd = true
    this.autorun(() => {
      this.y =
        (this.tunnel + 1) * this.danmakuEngine.fontSize +
        this.tunnel * this.danmakuEngine.gap
    })
  }

  private autorun(cb: noop) {
    this.unlistens.push(autorun(() => cb()))
  }
  private unlistens: noop[] = []

  override onUnload(): void {
    if (!this.tunnelOuted) {
      this.danmakuEngine.tunnelManager.popTunnel(this)
      this.danmakuEngine.emit('danmaku-leaveTunnel', this)
    }
    if (this.initd && this.drawSuccess) {
      this.danmakuEngine.emit('danmaku-leave', this)
    }
    this.unlistens.forEach((unlisten) => unlisten())
    this.unlistens.length = 0
    // this.reset()
  }

  override reset(): void {
    if (!this.initd) return
    this.initd = false
    this.disabled = false
    this.tunnelOuted = false
    this.moveX = 0
    this.x = 0
    this.y = 0
    this.tunnel = 0
    this.drawSuccess = false
  }

  /**给requestAnimationFrame用的 */
  draw(time: number) {
    if (this.disabled) return this.unload()
    if (time < this.startTime) {
      this.disabled = true
      return this.unload()
    }
    if (this.endTime && (time < this.startTime || time > this.endTime)) {
      this.disabled = true
      this.unload()
      return
    }

    switch (this.type) {
      case 'right': {
        this.moveX += this.speed
        this.x = this.container.clientWidth - this.moveX

        // 如果弹幕全部进入canvas，释放占位tunnel
        if (this.moveX >= this.width && !this.tunnelOuted) {
          this.tunnelOuted = true
          this.danmakuEngine.tunnelManager.popTunnel(this)
          this.danmakuEngine.emit('danmaku-leaveTunnel', this)
        }
        if (this.x + this.width <= 0) {
          this.disabled = true
        }
        break
      }
      case 'bottom':
      case 'top': {
        if (this.endTime - 1 < time && !this.tunnelOuted) {
          this.tunnelOuted = true
          this.danmakuEngine.tunnelManager.popTunnel(this)
          this.danmakuEngine.emit('danmaku-leaveTunnel', this)
          this.disabled = true
        }
        break
      }
    }

    if (!this.drawSuccess && !this.disabled) {
      this.drawSuccess = true
      this.danmakuEngine.emit('danmaku-enter', this)
    }

    this.renderDanmaku()
  }

  protected renderDanmaku() {
    if (!this.danmakuEngine.opacity) return
    const context = this.danmakuEngine.ctx,
      opacity = this.danmakuEngine.opacity,
      fontSize = this.danmakuEngine.fontSize,
      fontWeight = this.danmakuEngine.fontWeight,
      fontFamily = this.danmakuEngine.fontFamily,
      fontShadow = this.danmakuEngine.fontShadow

    context.shadowColor = 'rgba(0,0,0,0.5)'
    context.globalAlpha = opacity
    context.shadowBlur = 2
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    if (fontShadow) {
      context.fillStyle = 'rgba(0,0,0,0.5)'
      context.strokeText(this.text, this.x, this.y)
    }
    context.fillStyle = this.color
    context.fillText(this.text, this.x, this.y)
    context.shadowColor = 'none'
    context.shadowBlur = 0
    context.globalAlpha = 1
  }
}
