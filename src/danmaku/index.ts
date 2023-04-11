import MiniPlayer from '@root/miniPlayer'
import { getTextWidth } from '@root/utils'
import { clamp, omit } from 'lodash'
import Events from './events'
import utils from './utils'

export type DanmakuProps = {
  player: MiniPlayer
  /**预载弹幕 */
  dans?: DanType[]
}

type DanMoveType = 'top' | 'right' | 'bottom'

export type BaseDanType = {
  text: string
  color: string
  type: DanMoveType
}
export type DanType = {
  time: number
} & BaseDanType

export type RenderDanType = {
  tunnel: number
  x: number
  y: number
  timeLeft: number
} & BaseDanType

type OriginDanType = { text: string; color: string; type: string; time: number }

class DanmakuController {
  options: DanmakuProps
  player: DanmakuProps['player']

  danTunnel = {
    right: {},
    top: {},
    bottom: {},
  }
  dan: OriginDanType[] = []

  dans: DanType[] = []
  protected barrages: Barrage[] = []
  renderDans: RenderDanType[] = []

  constructor(options: DanmakuProps) {
    this.options = options
    this.player = this.options.player

    this.dans = this.options.dans
    this.barrages = this.options.dans.map(
      (d) => new Barrage({ config: d, player: this.player })
    )

    // 重置initd
    this.player.videoEl.addEventListener('seeked', () => {
      this.barrages.forEach((b) => {
        b.initd = false
        b.disabled = false
      })
    })
  }

  /**
   * 控制Y值
   * 这里绘制Barrage的y值需要在这里控制，tunnel采用boolean[]表示占位和y位，根据width + x计算是否还在tunnel占位，如果都在占位，就push一个新的tunnel值
   */
  // 绘制弹幕文本
  draw() {
    let videoCTime = this.player.videoEl.currentTime
    for (let barrage of this.barrages) {
      // 这里+1是给计算popTunnel用的
      let isInTimeRange =
        videoCTime >= barrage.startTime && videoCTime <= barrage.endTime + 1

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
  getTunnel(type: DanMoveType) {
    let find = this.tunnelsMap[type].findIndex((v) => v)
    if (find != -1) return find

    this.tunnelsMap[type].push(true)
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
   * TODO 需要计算出endTime
   */
  endTime = 0

  text = ''
  color = 'white'
  timeLeft = 5000

  actualX = 0
  speed = 0
  opacity = 1
  disabled = false
  initd = false

  tunnel = 0

  constructor(props: { player: MiniPlayer; config: DanType }) {
    let { config } = props
    // 一些变量参数
    this.text = config.text
    this.startTime = config.time
    this.player = props.player
    this.props = config
  }

  init() {
    let { props } = this
    // 1. 速度
    var speed = props.type == 'right' ? 2 : 0

    if (speed !== 0) {
      // 随着字数不同，速度会有微调
      speed = speed + props.text.length / 100
    }
    // 2. 字号大小
    var fontSize = this.player.props.danmu.fontSize || 12

    // 3. 文字颜色
    var color = props.color || 'white'

    // 4. range范围
    // var range = props.range || [0, 1]
    // 5. 透明度
    var opacity = this.player.props.danmu.opacity || 1

    // 求得文字内容宽度
    this.width = getTextWidth(props.text, {
      fontSize: fontSize + 'px',
      fontFamily: '"microsoft yahei", sans-serif',
    })

    let canvas = this.player.canvas

    // 初始水平位置和垂直位置
    this.x = canvas.width
    if (props.type != 'right') {
      this.x = (this.x - this.width) / 2
    }

    this.speed = speed
    this.opacity = opacity
    this.color = color
    // this.range = range
    this.fontSize = fontSize
    this.initd = true
    this.tunnel = this.player.danmaku.getTunnel(this.props.type)
  }

  // 根据此时x位置绘制文本
  draw(time: number) {
    if (time < this.startTime || this.disabled) return
    if (!this.initd) this.init()
    let percent = clamp(
      1 - (time - this.startTime) / (this.endTime - this.startTime),
      0,
      1
    )
    if (percent == 0 && time < this.endTime) {
      this.disabled = true
      this.player.danmaku.popTunnel(this.props.type, this.tunnel)
      return
    }

    this.x = this.player.canvas.width * percent + (1 - percent) * this.width

    let context = this.player.ctx,
      opacity = this.player.props.danmu.opacity,
      fontSize = this.player.props.danmu.fontSize

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
