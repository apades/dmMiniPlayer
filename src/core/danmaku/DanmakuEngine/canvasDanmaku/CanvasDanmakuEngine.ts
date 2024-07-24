import { noop } from '@root/utils'
import { DanmakuEngine } from '..'
import { DanmakuEngineInitProps } from '../DanmakuEngine'
import Danmaku from './CanvasDanmaku'
import CanvasDanmakuVideo from './CanvasDanmakuVideo'

export default class CanvasDanmakuEngine extends DanmakuEngine {
  Danmaku = Danmaku
  declare danmakus: Danmaku[]
  declare runningDanmakus: Danmaku[]

  canvasDanmakuVideo?: CanvasDanmakuVideo
  get canvas() {
    if (!this.canvasDanmakuVideo) throw Error('需要先调用init()')
    return this.canvasDanmakuVideo.canvas
  }
  get renderFPS() {
    if (!this.canvasDanmakuVideo) throw Error('需要先调用init()')
    return this.canvasDanmakuVideo.fps
  }
  get withoutLimitAnimaFPS() {
    if (!this.canvasDanmakuVideo) throw Error('需要先调用init()')
    return this.canvasDanmakuVideo.withoutLimitAnimaFPS
  }
  get ctx() {
    if (!this.canvasDanmakuVideo) throw Error('需要先调用init()')
    return this.canvasDanmakuVideo.ctx
  }

  get opacity() {
    if (!this.visible) return 0
    return super.opacity
  }

  onInit(props: DanmakuEngineInitProps): void {
    this.canvasDanmakuVideo = new CanvasDanmakuVideo({
      danmakuEngine: this,
      videoEl: props.media as HTMLVideoElement,
      fps: this.fps,
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    })

    this.container.appendChild(this.canvas)
    this.bindEvent()
  }
  private unlistens: noop[] = []
  onUnload(): void {
    this.unlistens.forEach((unlisten) => unlisten())
    this.canvasDanmakuVideo?.resizeObserver.disconnect()
  }

  bindEvent() {
    // addEventListener(this.media, (video) => {
    //   video.addEventListener('seeked', () => {
    //     this.tunnelManager.resetTunnelsMap()
    //     this.nowPos = 0
    //     this.runningDanmakus.length = 0
    //     this.danmakus.forEach((danmaku) => danmaku.unload())
    //   })
    // })
  }

  private nowPos = 0
  // 绘制弹幕文本
  draw() {
    if (!this.media) throw Error('需要先调用init()')

    const videoCTime = this.media.currentTime

    while (this.nowPos < this.danmakus.length) {
      const barrage = this.danmakus[this.nowPos]
      const startTime = barrage.startTime
      if (startTime >= videoCTime) {
        break
      }
      this.runningDanmakus.push(barrage)
      ++this.nowPos
    }
    const disableKeys: number[] = []
    for (const key in this.runningDanmakus) {
      const barrage = this.runningDanmakus[key]
      barrage.init({})
      barrage.draw(videoCTime)
      if (barrage.disabled) {
        disableKeys.unshift(+key)
        barrage.unload()
      }
    }
    disableKeys.forEach((key) => {
      this.runningDanmakus.splice(key, 1)
    })
  }
  // 绘制第一帧的弹幕，在时间变动时需要用的
  drawInSeek() {
    if (!this.media) throw Error('需要先调用init()')

    this.tunnelManager.resetTunnelsMap()
    this.nowPos = 0
    this.runningDanmakus.length = 0
    this.danmakus.forEach((danmaku) => danmaku.unload())
    const offsetStartTime = 10

    const videoCTime = this.media.currentTime
    const dansToDraw: Danmaku[] = []
    const rightDans: Danmaku[] = []
    const topDans: Danmaku[] = []
    // 在这个now ~ now - 30s范围前面的弹幕全部disabled
    // 现在把barrage.draw里的init没有传入time了，导致了seek后没有正确的moveX
    const beforeOffsetTimeDans: Danmaku[] = []
    for (const barrage of this.danmakus) {
      if (barrage.startTime > videoCTime) break
      if (barrage.startTime > videoCTime - offsetStartTime) {
        if (barrage.type === 'right') rightDans.push(barrage)
        if (barrage.type === 'top') topDans.push(barrage)
        dansToDraw.push(barrage)
      } else {
        beforeOffsetTimeDans.push(barrage)
      }
      ++this.nowPos
    }
    dansToDraw.forEach((d) => {
      d.init({ initTime: videoCTime })
      this.tunnelManager.popTunnel(d)
    })
    rightDans.forEach((b) => {
      b.disabled = false
    })
    beforeOffsetTimeDans.forEach((b) => {
      b.disabled = true
    })

    this.tunnelManager.resetTunnelsMap()
    // 这里只计算type:right的弹幕位置
    const rightDanOccupyWidthMap: Record<number, number> = {}
    for (const danmaku of rightDans) {
      const startX = this.container.clientWidth - danmaku.moveX,
        occupyRight = startX + danmaku.width
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

      if (toTunnel > this.tunnelManager.maxTunnel) {
        danmaku.reset()
        continue
      }
      // 这里是渲染时就在屏幕外，就站一个tunnel通道
      if (occupyRight >= this.container.clientWidth) {
        this.tunnelManager.tunnelsMap.right[toTunnel] = danmaku
      }
      danmaku.tunnel = toTunnel
      danmaku.y =
        (danmaku.tunnel + 1) * this.fontSize + danmaku.tunnel * this.gap
      danmaku.draw(videoCTime)
    }
    let topTunnel = 0
    const top: Danmaku[] = []
    for (const danmaku of topDans) {
      if (
        danmaku.endTime &&
        (videoCTime < danmaku.startTime || videoCTime > danmaku.endTime)
      ) {
        danmaku.disabled = true
        continue
      }
      if (danmaku.disabled) continue
      top[topTunnel] = danmaku
      danmaku.tunnel = topTunnel
      danmaku.y =
        (danmaku.tunnel + 1) * this.fontSize + danmaku.tunnel * this.gap
      danmaku.draw(videoCTime)
      topTunnel++
    }
    this.tunnelManager.tunnelsMap = { ...this.tunnelManager.tunnelsMap, top }
    this.runningDanmakus.push(...dansToDraw)
  }
}
