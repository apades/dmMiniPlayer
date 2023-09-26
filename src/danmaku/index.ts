import MiniPlayer from '@root/core/miniPlayer'
import configStore, { MaxTunnelType } from '@root/store/config'
import videoRender from '@root/store/videoRender'
import { clamp, getTextWidth } from '@root/utils'
import { observe } from 'mobx'

export type DanmakuProps = {
  player: MiniPlayer
  /**预载弹幕 */
  dans?: DanType[]
}

export type DanMoveType = 'top' | 'right' | 'bottom'

export type DanType = {
  text: string
  time: number
  color: string
  type: DanMoveType
}

class DanmakuController {
  options: DanmakuProps
  player: DanmakuProps['player']

  dans: DanType[] = []
  barrages: Barrage[] = []
  maxTunnel = 100

  constructor(options: DanmakuProps) {
    this.options = options
    this.player = this.options.player

    this.dans = this.options.dans || []
    this.barrages = this.dans.map(
      (d) => new Barrage({ config: d, player: this.player })
    )

    this.maxTunnel = this.calcMaxTunnel()

    observe(videoRender, 'containerHeight', () => {
      this.maxTunnel = this.calcMaxTunnel()
    })
  }

  calcMaxTunnel() {
    let { maxTunnel, gap, fontSize } = configStore
    let { containerHeight: renderHeight } = videoRender

    // (fontSize + gap) * x = renderHeight
    switch (maxTunnel) {
      case MaxTunnelType['1/2']:
        return renderHeight / 2 / (+fontSize + +gap)
      case MaxTunnelType['1/4']:
        return renderHeight / 4 / (+fontSize + +gap)
      case MaxTunnelType['full']:
        return 100
    }
  }

  initDans(dans: DanType[]) {
    this.tunnelsMap = { bottom: [], right: [], top: [] }
    this.dans = dans
    this.barrages = dans.map(
      (dan) => new Barrage({ config: dan, player: this.player })
    )
  }

  // 绘制弹幕文本
  draw() {
    let videoCTime = this.player.webPlayerVideoEl.currentTime
    for (let barrage of this.barrages) {
      if (!barrage.disabled) {
        barrage.draw(videoCTime)
      }
    }
  }

  tunnelsMap: { [key in DanMoveType]: boolean[] } = {
    bottom: [],
    right: [],
    top: [],
  }
  /**
   * 控制Y值
   * 这里绘制Barrage的y值需要在这里控制，tunnel采用boolean[]表示占位和y位，根据width + x计算是否还在tunnel占位，如果都在占位，就push一个新的tunnel值
   */
  getTunnel(type: DanMoveType) {
    let find = this.tunnelsMap[type].findIndex((v) => v)
    if (find != -1) {
      this.tunnelsMap[type][find] = false
      return find
    }

    this.tunnelsMap[type].push(false)

    let tunnel = this.tunnelsMap[type].length - 1
    return tunnel > this.maxTunnel ? -1 : tunnel
  }
  pushTunnel(type: DanMoveType) {
    let find = this.tunnelsMap[type].findIndex((v) => v)
    if (find != -1) {
      this.tunnelsMap[type][find] = false
      return
    }
    this.tunnelsMap[type].push(false)
  }
  popTunnel(type: DanMoveType, tunnel: number) {
    this.tunnelsMap[type][tunnel] = true
  }
}

export class Barrage {
  player: MiniPlayer
  props: DanType

  /**渲染的x,y */
  x = 0
  y = 0

  /**移动了的x */
  moveX = 0

  width = 0

  startTime = 0
  endTime = 0

  text = ''
  color = 'white'
  timeLeft = 5000

  disabled = false
  initd = false

  tunnel = 0
  tunnelOuted = false

  speed = 20
  hasObserve = false

  observer: any[] = []
  constructor(props: { player: MiniPlayer; config: DanType }) {
    let { config } = props
    // 一些变量参数
    this.text = config.text

    this.startTime = config.time

    this.player = props.player
    this.props = config
  }

  init(time?: number) {
    let { props } = this

    const _observer: typeof observe = (...args: any) => {
      if (this.hasObserve) return () => 0
      const unObserver = observe(...(args as [any, any]))
      this.observer.push(unObserver)
      return unObserver
    }

    if (props.type != 'right') {
      this.endTime = this.startTime + configStore.danVerticalSafeTime
      _observer(configStore, 'danVerticalSafeTime', () => {
        this.endTime = this.startTime + configStore.danVerticalSafeTime
      })
    } else {
      // ! 加个保底的time，不然跳到后段时需要计算太多的前面的弹幕位置了
      this.endTime = this.startTime + 30
    }
    let fontSize = configStore.fontSize ?? 12
    this.speed = configStore.danSpeed / 10
    _observer(configStore, 'danSpeed', () => {
      this.speed = configStore.danSpeed / 10
    })

    // 求得文字内容宽度
    this.width = getTextWidth(props.text, {
      fontSize: fontSize + 'px',
      fontFamily: '"microsoft yahei", sans-serif',
    })

    let canvas = this.player.canvas

    // 初始水平位置和垂直位置
    if (props.type != 'right') {
      this.x = (canvas.width - this.width) / 2
      // 这里observe config的width，然后改top type弹幕的位置，不然resize pip窗口会出现top弹幕错位

      _observer(videoRender, 'containerWidth', () => {
        console.log('change', canvas.width)
        this.x = (canvas.width - this.width) / 2
      })
    } else {
      this.x = canvas.width
      // TODO 跳时间进来时，偶然出现x会重叠，需要调整y值
      if (time) {
        const offsetTime = time - this.startTime
        // 大于5秒的再计算位置
        if (offsetTime > 3) {
          this.moveX =
            offsetTime * this.player.withoutLimitAnimaFPS * this.speed
        } else this.moveX = 0
      } else {
        this.moveX = 0
      }
    }

    this.initd = true

    this.tunnel = this.player.danmakuController.getTunnel(this.props.type)

    this.y = (this.tunnel + 1) * fontSize + this.tunnel * configStore.gap
    _observer(configStore, 'gap', () => {
      this.y = (this.tunnel + 1) * fontSize + this.tunnel * configStore.gap
    })

    this.color = props.color || 'white'
    this.hasObserve = true
  }

  clearAllObserve() {
    this.observer.forEach((ob) => ob())
    this.observer = []
    this.hasObserve = false
  }

  // 根据此时x位置绘制文本
  draw(time: number) {
    if (this.disabled) return this.clearAllObserve()
    if (time < this.startTime) return this.clearAllObserve()
    if (this.endTime && (time < this.startTime || time > this.endTime)) {
      this.disabled = true
      this.clearAllObserve()
      return
    }
    if (!this.initd) {
      this.init(time)
    }

    switch (this.props.type) {
      case 'right': {
        this.moveX += this.speed
        this.x = videoRender.containerWidth - this.moveX

        // 如果弹幕全部进入canvas，释放占位tunnel
        if (this.moveX >= this.width && !this.tunnelOuted) {
          this.tunnelOuted = true
          // console.log('tunnelOuted')
          this.player.danmakuController.popTunnel(this.props.type, this.tunnel)
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
          // console.log('tunnelOuted')
          this.player.danmakuController.popTunnel(this.props.type, this.tunnel)
        }
        break
      }
    }

    let context = this.player.ctx,
      opacity = configStore.opacity,
      fontSize = configStore.fontSize

    context.shadowColor = 'rgba(0,0,0,0.5)'
    context.globalAlpha = opacity
    context.shadowBlur = 2
    context.font = `${configStore.fontWeight} ${fontSize}px ${configStore.fontFamily}`
    context.fillStyle = this.color
    context.fillText(this.text, this.x, this.y)
    context.shadowColor = 'none'
    context.shadowBlur = 0
    context.globalAlpha = 1
    return true
  }
}

export default DanmakuController
