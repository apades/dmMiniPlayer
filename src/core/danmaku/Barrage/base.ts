import type MiniPlayer from '@root/core/miniPlayer'
import type { DanMoveType, DanType } from '@root/danmaku'
import configStore, { observe } from '@root/store/config'
import { observe as mobxObserver } from 'mobx'
import videoRender from '@root/store/videoRender'
import vpConfig from '@root/store/vpConfig'
import { getTextWidth, minmax } from '@root/utils'
import type { Rec } from '@root/utils/typeUtils'
import type { Lambda } from 'mobx'

export abstract class Barrage {
  /**渲染的x,y */
  x = 0
  y = 0

  startTime = 0
  endTime = 0

  text = ''
  type: DanMoveType

  /**移动了的x */
  moveX = 0
  width = 0
  color = 'white'
  speed = 20

  disabled = false
  initd = false

  tunnel = 0
  tunnelOuted = false

  player: MiniPlayer

  observes: Lambda[] = []
  /**弹幕确定载入时调用 */
  abstract onInit(time?: number): void
  init(time?: number) {
    this.onInit(time)
    this.initd = true
  }

  /**弹幕卸载时调用 */
  protected abstract onUnmount(): void
  /**弹幕控制器卸载弹幕时调用 */
  unmount() {
    if (!this.initd) return
    this.onUnmount()
    this.initd = false

    // 去除所有的config监听
    this.observes.forEach((unObserver) => unObserver())
    this.observes.length = 0
  }
  // 增加config监听
  onConfigChange<T extends Rec>(config: T, key: keyof T, fn: Lambda): Lambda
  onConfigChange(key: keyof typeof configStore, fn: Lambda): Lambda
  onConfigChange(...args: any[]) {
    if (args.length == 3) {
      const unObserver = mobxObserver(...(args as [any, any]))
      this.observes.push(unObserver)
      return () => this.offConfigChange(unObserver)
    }
    const unObserver = observe(...(args as [any, any]))
    this.observes.push(unObserver)
    return () => this.offConfigChange(unObserver)
  }
  // 关闭config监听
  offConfigChange(observer: Lambda) {
    this.observes = this.observes.filter((item) => item !== observer)
  }

  abstract onDraw(time: number): void
  draw(time: number) {
    this.onDraw(time)
  }
}

export class CanvasBarrage extends Barrage {
  constructor(props: { player: MiniPlayer; config: DanType }) {
    super()
    const { config } = props
    // 一些变量参数
    this.text = config.text

    this.startTime = config.time

    this.player = props.player
    this.type = config.type
    this.color = props.config.color || 'white'
  }

  onInit(time: number): void {
    this.x = 0
    this.y = 0
    this.tunnelOuted = false

    if (this.type != 'right') {
      this.onConfigChange('danVerticalSafeTime', () => {
        this.endTime = this.startTime + configStore.danVerticalSafeTime
      })
    } else {
      // ! 加个保底的time，不然跳到后段时需要计算太多的前面的弹幕位置了
      this.endTime = this.startTime + 30
    }

    const fontSize = configStore.fontSize
    this.onConfigChange('danSpeed', () => {
      this.speed = configStore.danSpeed / 10
    })
    // 求得文字内容宽度
    this.onConfigChange('fontSize', () => {
      this.width = getTextWidth(this.text, {
        fontSize: fontSize + 'px',
        fontFamily: configStore.fontFamily,
      })
    })

    const fontResizeEvents: (keyof typeof configStore)[] = [
      'adjustFontsizeByPIPWidthResize',
      'adjustFontsizeStartWidth',
      'adjustFontsizeScaleRate',
      'adjustFontsizeMaxSize',
      'fontSize',
    ]

    const handleOnFontResize = () => {
      if (!configStore.adjustFontsizeByPIPWidthResize) return
      const tarSize =
        (configStore.fontSize / configStore.adjustFontsizeStartWidth) *
        videoRender.containerWidth *
        configStore.adjustFontsizeScaleRate

      this.width = getTextWidth(this.text, {
        fontSize: minmax(tarSize, 0, configStore.adjustFontsizeMaxSize) + 'px',
        fontFamily: configStore.fontFamily,
      })
    }
    fontResizeEvents.forEach((e) => this.onConfigChange(e, handleOnFontResize))
    this.onConfigChange(videoRender, 'containerWidth', handleOnFontResize)

    const canvas = this.player.canvas
    // 初始水平位置和垂直位置
    if (this.type != 'right') {
      this.onConfigChange(videoRender, 'containerWidth', () => {
        this.x = (canvas.width - this.width) / 2
      })
    } else {
      this.x = canvas.width
      if (time) {
        const offsetTime = time - this.startTime
        this.moveX =
          offsetTime *
          (configStore.renderFPS || this.player.withoutLimitAnimaFPS || 60) *
          this.speed
      } else {
        this.moveX = 0
      }

      this.tunnel = this.player.danmakuController.getTunnel(this.type)
      if (this.tunnel == -1) this.disabled = true

      this.onConfigChange('gap', () => {
        this.y = (this.tunnel + 1) * fontSize + this.tunnel * configStore.gap
      })
    }
  }
  protected onUnmount(): void {}
  onDraw(time: number): void {
    if (this.disabled) return this.unmount()

    switch (this.type) {
      case 'right': {
        this.moveX += this.speed
        this.x = videoRender.containerWidth - this.moveX

        // 如果弹幕全部进入canvas，释放占位tunnel
        if (this.moveX >= this.width && !this.tunnelOuted) {
          this.tunnelOuted = true
          this.player.danmakuController.popTunnel(this.type, this.tunnel)
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
          this.player.danmakuController.popTunnel(this.type, this.tunnel)
        }
        break
      }
    }

    const context = this.player.ctx,
      opacity = vpConfig.showBarrage ? configStore.opacity : 0,
      fontSize = configStore.fontSize

    context.shadowColor = 'rgba(0,0,0,0.5)'
    context.globalAlpha = opacity
    context.shadowBlur = 2
    context.font = `${configStore.fontWeight} ${fontSize}px ${configStore.fontFamily}`
    if (configStore.fontShadow) {
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

export class HtmlBarrage extends Barrage {
  onInit(): void {}
  protected onUnmount(): void {}
  onDraw(time: number): void {}
}
