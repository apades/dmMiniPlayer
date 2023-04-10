import MiniPlayer from '@root/miniPlayer'
import Events from './events'
import utils from './utils'

export type DanmakuProps = {
  player: MiniPlayer
  container: {
    width: number
    height: number
  }
  opacity: number
  callback: () => void
  error: (msg: string) => void
  borderColor: string
  height: number
  time: () => number
  unlimited: boolean
  events: Events
  tran: (msg: string) => string

  /**预载弹幕 */
  dans?: DanType[]
}

export type BaseDanType = {
  text: string
  color: string
  type: string
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
  container: DanmakuProps['container']
  _opacity: DanmakuProps['opacity']
  events: DanmakuProps['events']
  unlimited: DanmakuProps['unlimited']

  danTunnel = {
    right: {},
    top: {},
    bottom: {},
  }
  danIndex = 0
  dan: OriginDanType[] = []
  showing = true
  paused = true

  dans: Barrage[] = []
  renderDans: RenderDanType[] = []

  constructor(options: DanmakuProps) {
    this.options = options
    this.player = this.options.player
    this.container = this.options.container
    this._opacity = this.options.opacity
    this.events = this.options.events
    this.unlimited = this.options.unlimited

    // this.dans = this.options.dans

    requestAnimationFrame(this.update)
  }

  // 绘制弹幕文本
  draw() {
    // 清除画布
    this.player.ctx.clearRect(
      0,
      0,
      this.player.canvas.width,
      this.player.canvas.height
    )
    for (var index in this.dans) {
      var barrage = this.dans[index]

      if (
        barrage &&
        !barrage.disabled &&
        this.player.videoEl.currentTime >= barrage.time
      ) {
        if (!barrage.initd) {
          barrage.init()
          barrage.initd = true
        }
        barrage.x -= barrage.moveX
        if (barrage.moveX == 0) {
          // 不动的弹幕
          barrage.actualX -= top.speed
        } else {
          barrage.actualX = barrage.x
        }
        // 移出屏幕
        if (barrage.actualX < -1 * barrage.width) {
          // 下面这行给speed为0的弹幕
          barrage.x = barrage.actualX
          // 该弹幕不运动
          barrage.disabled = true
        }
        // 根据新位置绘制圆圈圈
        barrage.draw()
      }
    }
  }

  update() {
    // 继续渲染
    if (this.paused != false) {
      // 绘制画布
      this.draw()
    }
    requestAnimationFrame(this.update)
  }
}

type BarrageProps = {
  speed: number
  value: string
  fontSize: string
  color: string
  range: [number, number]
  opacity: number
}
class Barrage {
  player: MiniPlayer
  obj: BarrageProps
  fontSize: string

  x = 0
  y = 0
  width = 0
  time = 0
  text = ''
  color = 'white'
  timeLeft = 5000

  actualX = 0
  moveX = 0
  opacity = 1
  range = [0, 0]
  disabled = false
  initd = false

  constructor(obj: any) {
    // 一些变量参数
    this.text = obj.value
    this.time = obj.time
    this.obj = obj
    // data中的可以覆盖全局的设置
  }

  init() {
    let { obj } = this
    // 1. 速度
    var speed = top.speed
    if (obj.hasOwnProperty('speed')) {
      speed = obj.speed
    }
    if (speed !== 0) {
      // 随着字数不同，速度会有微调
      speed = speed + obj.value.length / 100
    }
    // 2. 字号大小
    var fontSize = obj.fontSize || top.fontSize

    // 3. 文字颜色
    var color = obj.color || top.color
    // 转换成rgb颜色
    color = (function () {
      var div = document.createElement('div')
      div.style.backgroundColor = color
      document.body.appendChild(div)
      var c = window.getComputedStyle(div).backgroundColor
      document.body.removeChild(div)
      return c
    })()

    // 4. range范围
    var range = obj.range || top.range
    // 5. 透明度
    var opacity = obj.opacity || top.opacity
    opacity = opacity / 100

    // 计算出内容长度
    var span = document.createElement('span')
    span.style.position = 'absolute'
    span.style.whiteSpace = 'nowrap'
    span.style.font = 'bold ' + fontSize + 'px "microsoft yahei", sans-serif'
    span.innerText = obj.value
    span.textContent = obj.value
    document.body.appendChild(span)
    // 求得文字内容宽度
    this.width = span.clientWidth
    // 移除dom元素
    document.body.removeChild(span)

    let canvas = this.player.canvas
    // 初始水平位置和垂直位置
    this.x = canvas.width
    if (speed == 0) {
      this.x = (this.x - this.width) / 2
    }
    this.actualX = canvas.width
    this.y =
      range[0] * canvas.height +
      (range[1] - range[0]) * canvas.height * Math.random()
    if (this.y < fontSize) {
      this.y = fontSize
    } else if (this.y > canvas.height - fontSize) {
      this.y = canvas.height - fontSize
    }

    this.moveX = speed
    this.opacity = opacity
    this.color = color
    this.range = range
    this.fontSize = fontSize
  }

  // 根据此时x位置绘制文本
  draw() {
    if (this.timeLeft >= 0) {
    }
    let context = this.player.ctx,
      opacity = this.player.props.danmu.opacity,
      fontSize = this.player.props.danmu.height

    context.shadowColor = 'rgba(0,0,0,' + opacity + ')'
    context.shadowBlur = 2
    context.font = fontSize + 'px "microsoft yahei", sans-serif'
    context.fillStyle = this.color
    // 填色
    context.fillText(this.text, this.x, this.y)
  }
}

export default DanmakuController
