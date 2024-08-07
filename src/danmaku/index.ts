import MiniPlayer from '@root/core/miniPlayer'
import configStore from '@root/store/config'
import { MaxTunnelType } from '@root/store/config/danmaku'
import videoRender from '@root/store/videoRender'
import vpConfig from '@root/store/vpConfig'
import { clamp, filterList, getTextWidth, minmax } from '@root/utils'
import { autorun, observe } from 'mobx'

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
    this.dans = dans
    this.barrages = dans.map(
      (dan) => new Barrage({ config: dan, player: this.player })
    )

    this.initTunnelMap()
    this.nowPos = 0
    this.runningBarrages = []
  }

  private runningBarrages: Barrage[] = []
  private nowPos = 0
  // 绘制弹幕文本
  draw() {
    let videoCTime = this.player.webPlayerVideoEl.currentTime

    while (this.nowPos < this.barrages.length) {
      const barrage = this.barrages[this.nowPos]
      const startTime = barrage.startTime
      if (startTime >= videoCTime) {
        break
      }
      this.runningBarrages.push(barrage)
      ++this.nowPos
    }
    const disableKeys: number[] = []
    for (const key in this.runningBarrages) {
      const barrage = this.runningBarrages[key]
      barrage.draw(videoCTime)
      if (barrage.disabled) {
        disableKeys.unshift(+key)
      }
    }
    disableKeys.forEach((key) => {
      this.runningBarrages.splice(key, 1)
    })
  }
  // 绘制第一帧的弹幕，在时间变动时需要用的
  drawInSeek() {
    console.log('drawInSeek')
    const offsetStartTime = 10

    const videoCTime = this.player.webPlayerVideoEl.currentTime
    const dansToDraw: Barrage[] = []
    const rightDans: Barrage[] = []
    const topDans: Barrage[] = []
    // 在这个now ~ now - 30s范围前面的弹幕全部disabled
    // 现在把barrage.draw里的init没有传入time了，导致了seek后没有正确的moveX
    const beforeOffsetTimeDans: Barrage[] = []
    for (const barrage of this.barrages) {
      if (barrage.startTime > videoCTime) break
      if (barrage.startTime > videoCTime - offsetStartTime) {
        if (barrage.props.type === 'right') rightDans.push(barrage)
        if (barrage.props.type === 'top') topDans.push(barrage)
        dansToDraw.push(barrage)
      } else {
        beforeOffsetTimeDans.push(barrage)
      }
    }
    dansToDraw.forEach((b) => {
      b.init(videoCTime)
    })
    rightDans.forEach((b) => {
      b.disabled = false
    })
    beforeOffsetTimeDans.forEach((b) => {
      b.disabled = true
    })

    this.initTunnelMap()
    // 这里只计算type:right的弹幕位置
    const rightDanOccupyWidthMap: Record<number, number> = {}
    for (const barrage of rightDans) {
      const startX = videoRender.containerWidth - barrage.moveX,
        occupyRight = startX + barrage.width
      let toTunnel = 0
      while (true) {
        if (!rightDanOccupyWidthMap[toTunnel]) {
          rightDanOccupyWidthMap[toTunnel] = occupyRight
          break
        }
        if (rightDanOccupyWidthMap[toTunnel] < startX) {
          rightDanOccupyWidthMap[toTunnel] = occupyRight
          break
        }
        toTunnel++
      }

      if (toTunnel > this.maxTunnel) {
        continue
      }
      // 这里是渲染时就在屏幕外，就站一个tunnel通道
      if (occupyRight >= videoRender.containerWidth) {
        this.tunnelsMap.right[toTunnel] = false
      }
      barrage.tunnel = toTunnel
      barrage.y =
        (barrage.tunnel + 1) * videoRender.fontSize +
        barrage.tunnel * configStore.gap
      barrage.draw(videoCTime)
    }
    let topTunnel = 0
    const top: boolean[] = []
    for (const barrage of topDans) {
      if (
        barrage.endTime &&
        (videoCTime < barrage.startTime || videoCTime > barrage.endTime)
      ) {
        barrage.disabled = true
        continue
      }
      if (barrage.disabled) continue
      top[topTunnel] = true
      barrage.tunnel = topTunnel
      barrage.y =
        (barrage.tunnel + 1) * videoRender.fontSize +
        barrage.tunnel * configStore.gap
      barrage.draw(videoCTime)
      topTunnel++
    }
    this.tunnelsMap = { ...this.tunnelsMap, top }
  }

  tunnelsMap: { [key in DanMoveType]: boolean[] } = {
    bottom: [],
    right: [],
    top: [],
  }
  /**
   * 控制Y值
   * 这里绘制Barrage的y值需要在这里控制，tunnel采用false和boolean[]表示占位和y位，根据width + x计算是否还在tunnel占位，如果都在占位，就push一个新的tunnel值
   */
  getTunnel(type: DanMoveType) {
    let find = this.tunnelsMap[type].findIndex((v) => v)
    if (find != -1) {
      this.tunnelsMap[type][find] = false
      return find > this.maxTunnel ? -1 : find
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
  initTunnelMap() {
    this.tunnelsMap = {
      bottom: [],
      right: [],
      top: [],
    }
  }

  reset() {
    this.initTunnelMap()
    this.barrages.forEach((b) => {
      b.reset()
    })
    this.nowPos = 0
    this.runningBarrages = []
  }
}

export class Barrage {
  /**渲染的x,y */
  x = 0
  y = 0

  startTime = 0
  endTime = 0

  text = ''

  /**移动了的x */
  moveX = 0

  width = 0

  color = 'white'
  // timeLeft = 5000

  disabled = false
  initd = false

  tunnel = 0
  tunnelOuted = false

  speed = 20
  hasObserve = false

  player: MiniPlayer
  props: DanType

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
    this.speed = configStore.danSpeed / 10
    _observer(configStore, 'danSpeed', () => {
      this.speed = configStore.danSpeed / 10
    })

    // 求得文字内容宽度
    this.width = getTextWidth(props.text, {
      fontSize: videoRender.fontSize + 'px',
      fontFamily: configStore.fontFamily,
    })

    let canvas = this.player.canvas

    // 初始水平位置和垂直位置
    if (props.type != 'right') {
      this.x = (canvas.width - this.width) / 2 / window.devicePixelRatio
      // 这里observe config的width，然后改top type弹幕的位置，不然resize pip窗口会出现top弹幕错位

      _observer(videoRender, 'containerWidth', () => {
        this.x = (canvas.width - this.width) / 2 / window.devicePixelRatio
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
    }

    this.initd = true
    this.tunnel = this.player.danmakuController.getTunnel(this.props.type)

    this.y =
      (this.tunnel + 1) * videoRender.fontSize + this.tunnel * configStore.gap
    _observer(configStore, 'gap', () => {
      this.y =
        (this.tunnel + 1) * videoRender.fontSize + this.tunnel * configStore.gap
    })

    this.color = props.color || 'white'

    _observer(videoRender, 'fontSize', () => {
      this.width = getTextWidth(this.text, {
        fontSize: videoRender.fontSize + 'px',
        fontFamily: configStore.fontFamily,
      })
      if (props.type != 'right') {
        this.x = (canvas.width - this.width) / 2
      }
    })

    this.hasObserve = true
    if (this.tunnel == -1) {
      this.disabled = true
    }
  }

  clearAllObserve() {
    this.observer.forEach((ob) => ob())
    this.observer = []
    this.hasObserve = false
  }

  reset() {
    this.initd = false
    this.disabled = false
    this.tunnelOuted = false
    this.moveX = 0
    this.x = 0
    this.y = 0
    this.tunnel = 0
    this.clearAllObserve()
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
      this.init()
    }

    switch (this.props.type) {
      case 'right': {
        this.moveX += this.speed
        this.x = videoRender.containerWidth - this.moveX

        // 如果弹幕全部进入canvas，释放占位tunnel
        if (this.moveX >= this.width && !this.tunnelOuted) {
          this.tunnelOuted = true
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
          this.player.danmakuController.popTunnel(this.props.type, this.tunnel)
        }
        break
      }
    }

    let context = this.player.ctx,
      opacity = vpConfig.showDanmaku ? configStore.opacity : 0,
      fontSize = videoRender.fontSize

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
    return true
  }
}

export default DanmakuController
