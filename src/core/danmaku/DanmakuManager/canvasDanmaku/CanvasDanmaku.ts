import { autorun } from 'mobx'
import { Danmaku } from '../'
import type { DanmakuInitProps } from '../Danmaku'
import { getTextWidth, noop } from '@root/utils'
import CanvasDanmakuManager from './CanvasDanmakuManager'

export default class CanvasDanmaku extends Danmaku {
  declare danmakuManager: CanvasDanmakuManager

  // 渲染的x,y
  x = 0
  y = 0

  /**移动了的x */
  moveX = 0

  startTime = 0
  endTime = 0

  tunnelOuted = false

  drawSuccess = false

  get speed() {
    return super.speed / 10
  }

  constructor(props: ConstructorParameters<typeof Danmaku>[0]) {
    super(props)
    this.startTime = this.time
  }
  onInit(props: DanmakuInitProps): void {
    if (this.initd) return
    this.tunnel = this.danmakuManager.tunnelManager.getTunnel(this)
    if (this.tunnel == -1) {
      this.disabled = true
      return
    }

    if (this.type != 'right') {
      this.autorun(() => {
        this.endTime =
          this.startTime + this.danmakuManager.unmovingDanmakuSaveTime
      })
    } else {
      // ! 加个保底的time，不然跳到后段时需要计算太多的前面的弹幕位置了
      this.endTime = this.startTime + 30
    }

    const canvas = this.danmakuManager.canvas

    this.autorun(() => {
      this.width = getTextWidth(this.text, {
        fontSize: this.danmakuManager.fontSize + 'px',
        fontFamily: this.danmakuManager.fontFamily,
        fontWeight: this.danmakuManager.fontWeight,
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
          (this.danmakuManager.renderFPS ||
            this.danmakuManager.withoutLimitAnimaFPS ||
            60) *
          this.speed
      } else {
        this.moveX = 0
      }
    }

    this.initd = true
    this.autorun(() => {
      this.y =
        (this.tunnel + 1) * this.danmakuManager.fontSize +
        this.tunnel * this.danmakuManager.gap
    })
  }

  private autorun(cb: noop) {
    this.unlistens.push(autorun(() => cb()))
  }
  private unlistens: noop[] = []

  onUnload(): void {
    if (this.initd && this.drawSuccess) {
      this.danmakuManager.emit('danmaku-leave', this)
    }
    this.unlistens.forEach((unlisten) => unlisten())
    this.unlistens.length = 0
    this.reset()

    if (this.type != 'right') {
      this.danmakuManager.tunnelManager.popTunnel(this)
    } else if (
      this.danmakuManager.tunnelManager.tunnelsMap['right'][this.tunnel] == this
    ) {
      this.danmakuManager.tunnelManager.popTunnel(this)
    }
  }

  reset(): void {
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
    if (time < this.startTime) return this.unload()
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
          this.danmakuManager.tunnelManager.popTunnel(this)
          this.danmakuManager.emit('danmaku-leaveTunnel', this)
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
          this.danmakuManager.tunnelManager.popTunnel(this)
        }
        break
      }
    }

    if (!this.drawSuccess && !this.disabled) {
      this.drawSuccess = true
      this.danmakuManager.emit('danmaku-enter', this)
    }

    this.renderDanmaku()
  }

  protected renderDanmaku() {
    const context = this.danmakuManager.ctx,
      opacity = this.danmakuManager.opacity,
      fontSize = this.danmakuManager.fontSize,
      fontWeight = this.danmakuManager.fontWeight,
      fontFamily = this.danmakuManager.fontFamily,
      fontShadow = this.danmakuManager.fontShadow

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
