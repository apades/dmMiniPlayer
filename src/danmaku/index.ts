import MiniPlayer from '@root/miniPlayer'
import configStore from '@root/store/config'
import { getTextWidth } from '@root/utils'
import { clamp, omit } from 'lodash'

export type DanmakuProps = {
  player: MiniPlayer
  /**预载弹幕 */
  dans?: DanType[]

  // TODO 实时弹幕类型
  ws?: (onNewDan: (dan: DanType) => void) => void
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
  protected barrages: Barrage[] = []

  constructor(options: DanmakuProps) {
    this.options = options
    this.player = this.options.player

    this.dans = this.options.dans || []
    this.barrages = this.dans.map(
      (d) => new Barrage({ config: d, player: this.player })
    )

    if (options.ws) {
      const onNewDan = (dan: DanType) => {
        this.barrages.push(new Barrage({ config: dan, player: this.player }))
      }

      options.ws(onNewDan)
    }
  }

  // 绘制弹幕文本
  draw() {
    let videoCTime = this.player.videoEl.currentTime
    for (let barrage of this.barrages) {
      // 这里+1是给计算popTunnel用的
      let isInTimeRange =
        videoCTime >= barrage.startTime && videoCTime <= barrage.endTime + 1

      // if (!barrage.initd) {
      //   barrage.init()
      // }
      if (!barrage.disabled && isInTimeRange) {
        // 根据新位置绘制圆圈圈
        barrage.draw(this.player.videoEl.currentTime)
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
    return this.tunnelsMap[type].length - 1
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
  fontSize: number

  /**渲染的x,y */
  x = 0
  y = 0

  width = 0

  startTime = 0
  /**
   * FIXME 因为用的简单endTime会导致很多弹幕下会有多个弹幕重叠问题
   * TODO 现在是简单的startTime + 5，可能需要支持计算长度的endTime
   */
  endTime = 0

  text = ''
  color = 'white'
  timeLeft = 5000

  opacity = 1
  disabled = false
  initd = false

  tunnel = 0
  tunnelOuted = false

  constructor(props: { player: MiniPlayer; config: DanType }) {
    let { config } = props
    // 一些变量参数
    this.text = config.text

    this.startTime = config.time
    this.endTime = this.startTime + 5

    this.player = props.player
    this.props = config
  }

  init() {
    let { props } = this

    let fontSize = configStore.fontSize ?? 12
    let color = props.color || 'white'
    let opacity = configStore.opacity || 1

    // 求得文字内容宽度
    this.width = getTextWidth(props.text, {
      fontSize: fontSize + 'px',
      fontFamily: '"microsoft yahei", sans-serif',
    })

    let canvas = this.player.canvas

    // TODO 这里可以observe config的width，然后改top type弹幕的位置，不然resize pip窗口会出现top弹幕错位
    // 初始水平位置和垂直位置
    this.x = canvas.width
    if (props.type != 'right') {
      this.x = (this.x - this.width) / 2
    }

    this.opacity = opacity
    this.color = color
    // this.range = range
    this.fontSize = fontSize
    this.initd = true

    this.tunnel = this.player.danmaku.getTunnel(this.props.type)
    this.y = (this.tunnel + 1) * this.fontSize
  }

  // 根据此时x位置绘制文本
  draw(time: number) {
    if (time < this.startTime || this.disabled || time > this.endTime) return
    if (!this.initd) {
      // console.log('init')
      this.init()
    }
    let percent = clamp(
      1 - (time - this.startTime) / (this.endTime - this.startTime),
      0,
      1
    )

    switch (this.props.type) {
      case 'right': {
        this.x = configStore.renderWidth * percent - (1 - percent) * this.width

        // 如果弹幕全部进入canvas，释放占位tunnel
        if (
          this.x <= configStore.renderWidth - this.width &&
          !this.tunnelOuted
        ) {
          this.tunnelOuted = true
          // console.log('tunnelOuted')
          this.player.danmaku.popTunnel(this.props.type, this.tunnel)
        }
        break
      }
      case 'top': {
        if (this.endTime - 1 < time && !this.tunnelOuted) {
          this.tunnelOuted = true
          // console.log('tunnelOuted')
          this.player.danmaku.popTunnel(this.props.type, this.tunnel)
        }
        break
      }
    }

    // TODO 弹幕有点看不清
    let context = this.player.ctx,
      opacity = configStore.opacity,
      fontSize = configStore.fontSize

    context.shadowColor = 'rgba(0,0,0,' + opacity + ')'
    context.shadowBlur = 2
    context.font = fontSize + 'px "microsoft yahei", sans-serif'
    context.fillStyle = this.color
    // 填色
    context.fillText(this.text, this.x, this.y)

    return true
  }
}

export default DanmakuController
