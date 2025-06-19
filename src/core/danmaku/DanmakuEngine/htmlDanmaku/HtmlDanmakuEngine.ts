import { addEventListener, createElement, noop } from '@root/utils'
import { autorun } from 'mobx'
import { DanmakuEngine } from '..'
import type { DanmakuEngineInitProps } from '../DanmakuEngine'
import Danmaku from './HtmlDanmaku'
import style from './index.less?inline'

export default class HtmlDanmakuManager extends DanmakuEngine {
  Danmaku = Danmaku
  declare danmakus: Danmaku[]
  declare runningDanmakus: Set<Danmaku>

  style = createElement('style', {
    innerHTML: style,
  })

  /**canvas的速度受fps影响，要想dom的速度和canvas一样需要乘上fps值 */
  get speed() {
    return (super.speed * this.fps) / 10
  }

  // html弹幕通过监听每个弹幕后面的span的进入页面来触发onDanmakuOutTunnel
  observerMap = new Map<HTMLSpanElement, Danmaku>()
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const target = entry.target as HTMLSpanElement
      // 莫名其妙的会监听到这个container
      if (target == this.container) return

      const danmaku = this.observerMap.get(target)
      if (danmaku) {
        this.onMovingDanmakuOutTunnel(danmaku)
      } else {
        console.error('发现不存在observerMap但在监听的danmaku', target)
      }
    })
  })
  observeMovingDanmakuOutTunnel(danmaku: Danmaku) {
    if (danmaku.tunnel == -1) return
    // 只监听会动的弹幕，其他不需要
    if (danmaku.type != 'right') return
    if (!danmaku.outTunnelObserveEl) return
    this.observerMap.set(danmaku.outTunnelObserveEl, danmaku)
    this.observer.observe(danmaku.outTunnelObserveEl)
  }
  protected onMovingDanmakuOutTunnel(danmaku: Danmaku) {
    if (!danmaku.outTunnelObserveEl) return
    this.observer.unobserve(danmaku.outTunnelObserveEl)
    this.observerMap.delete(danmaku.outTunnelObserveEl)
    danmaku.outTunnel = true
    if (this.tunnelManager.popTunnel(danmaku)) {
      // ? 这里要不要从穿个参数表示是旧的observer的
      danmaku.danmakuEngine.emit('danmaku-leaveTunnel', danmaku)
    }
  }

  onInit(props: DanmakuEngineInitProps): void {
    this.resetState()
    this.container.classList.add('danmaku-container')
    this.container.appendChild(this.style)

    const confUnlisten = autorun(() => {
      this.updateState()
    })

    this.bindEvent(props.media)
    this.unlistens = [confUnlisten]
  }
  private unlistens: noop[] = []
  onUnload() {
    this.unbindEvent()
    this.unlistens.forEach((unlisten) => unlisten())
    this.observer.disconnect()
    this.observerMap.clear()
  }

  updateState() {
    this.container.style.setProperty('--font-size', this.fontSize + 'px')
    this.container.style.setProperty('--gap', this.gap + 'px')
    this.container.style.setProperty('--font-weight', this.fontWeight + '')
    this.container.style.setProperty('--font-family', this.fontFamily)
    this.container.style.setProperty('--opacity', this.opacity + '')
  }

  private nowPos = 0
  private unbindEvent = () => {}
  private bindEvent(media: HTMLMediaElement) {
    const mediaUnbind = addEventListener(media, (el) => {
      el.addEventListener('play', () => {
        this.container.classList.remove('paused')
      })
      el.addEventListener('pause', () => {
        this.container.classList.add('paused')
      })
      el.addEventListener('seeking', () => {
        this.forceRerenderDanmaku()
      })
      el.addEventListener('timeupdate', () => {
        if (!this.danmakus.length) return
        const ctime = el.currentTime
        const toRunDanmakus: Danmaku[] = []
        while (this.nowPos < this.danmakus.length) {
          const danmaku = this.danmakus[this.nowPos]
          const startTime = danmaku.time
          if (startTime > ctime) {
            break
          }
          if (startTime > ctime - this.offsetStartTime) {
            toRunDanmakus.push(danmaku)
          }
          ++this.nowPos
        }
        const disableKeys: number[] = []
        // 这里只计算type:right的弹幕位置
        const rightDanOccupyWidthMap: Record<number, number> = {}

        for (const key in toRunDanmakus) {
          const danmaku = toRunDanmakus[key]
          danmaku.init({ initTime: this.hasSeek ? ctime : undefined })
          if (danmaku.initd) {
            disableKeys.unshift(+key)
          } else {
            continue
          }

          // hasSeek下不需要处理非right的弹幕
          if (this.hasSeek && danmaku.type != 'right') {
            this.observeMovingDanmakuOutTunnel(danmaku)
            continue
          }

          // 处理seek的弹幕
          // 根据长度判断是否要监听退出tunnel事件
          if (this.hasSeek) {
            // 不要tunnelManager的tunnel，自己计算一套tunnel再占领tunnelsMap位置
            this.tunnelManager.popTunnel(danmaku)

            const { width } = danmaku,
              offsetTime = ctime - danmaku.time,
              speed = this.speed

            const movedX = speed * offsetTime

            const startX = this.container.clientWidth - movedX,
              occupyRight = startX + width

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

            // 这里是渲染时就在屏幕外，就占用一个tunnel通道
            if (occupyRight >= this.container.clientWidth) {
              this.tunnelManager.tunnelsMap.right[toTunnel] = danmaku
              this.observeMovingDanmakuOutTunnel(danmaku)
            }
            danmaku.tunnel = toTunnel
            danmaku.updateState()
          } else {
            this.observeMovingDanmakuOutTunnel(danmaku)
          }
        }

        this.hasSeek = false
      })
    })

    this.unbindEvent = () => {
      mediaUnbind()
    }
  }

  resetState() {
    this.runningDanmakus.forEach((d) => d.reset())
    this.nowPos = 0
    super.resetState()
  }
  changeVisible(visible?: boolean): void {
    super.changeVisible(visible)

    if (this.visible) {
      this.container.style.visibility = ''
    } else {
      this.container.style.visibility = 'hidden'
    }
  }

  updateVideo(video: HTMLVideoElement): void {
    this.unbindEvent()
    this.media = video
    this.bindEvent(video)
  }

  override forceRerenderDanmaku(): void {
    super.forceRerenderDanmaku()
    this.nowPos = 0
  }
}
