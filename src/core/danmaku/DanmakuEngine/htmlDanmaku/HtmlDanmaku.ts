import { addEventListener, createElement, getTextWidth } from '@root/utils'
import { DanmakuBase } from '../'
import type { DanmakuInitProps } from '../DanmakuBase'

export default class HtmlDanmaku extends DanmakuBase {
  // 弹幕el: text_<s></s>
  // 通过用IntersectionObserver监听<s>是否enter或leave，占领/释放弹幕tunnel
  // TODO 还需要解决缩放后一个tunnel还有2个以上变化到leave，第一个enter并leave，那第二个会跟新danmakus冲突的情况
  el?: HTMLElement
  /**给tunnelManager监听 */
  outTunnelObserveEl?: HTMLSpanElement

  onInit(props: DanmakuInitProps): void {
    this.tunnel = this.danmakuEngine.tunnelManager.getTunnel(this)
    if (this.tunnel === -1) {
      this.disabled = true
      return
    }

    this.initTime = props.initTime || this.time

    this.outTunnelObserveEl = createElement('span')
    this.el = createElement('div', {
      className: `danmaku-item ${this.type}`,
      innerText: this.text,
      children: [this.outTunnelObserveEl],
    })

    this.updateState()
    this.container.appendChild(this.el)

    this.danmakuEngine.emit('danmaku-enter', this)
    this.bindEvent()
    this.initd = true
    this.danmakuEngine.runningDanmakus.add(this)
  }

  private unbindEvent = () => {}
  private bindEvent() {
    if (!this.el) return

    switch (this.type) {
      case 'right': {
        const unbind1 = addEventListener(this.el, (el) => {
          el.addEventListener('animationend', () => {
            this.danmakuEngine.emit('danmaku-leave', this)
            this.onLeave()
          })
        })

        this.unbindEvent = () => {
          unbind1()
        }
        break
      }
      case 'bottom':
      case 'top': {
        // 只需要监听el的动画结束就行了
        const unbind1 = addEventListener(this.el, (el) => {
          el.addEventListener('animationend', () => {
            this.outTunnel = true
            // console.log('outTunnel', this)
            this.danmakuEngine.emit('danmaku-leaveTunnel', this)
            this.danmakuEngine.tunnelManager.popTunnel(this)
            this.danmakuEngine.emit('danmaku-leave', this)
            this.onLeave()
          })
        })
        this.unbindEvent = () => {
          unbind1()
        }
      }
    }
  }

  updateState() {
    const w = getTextWidth(this.text, {
      fontSize: this.danmakuEngine.fontSize + 'px',
      fontFamily: this.danmakuEngine.fontFamily,
      fontWeight: this.danmakuEngine.fontWeight,
    })
    this.width = w

    const cw = this.container.clientWidth
    const initTimeOffset = this.initTime - this.time

    let duration = this.danmakuEngine.unmovingDanmakuSaveTime - initTimeOffset,
      offset = cw - initTimeOffset * this.speed,
      translateX = 0
    if (this.type === 'right') {
      duration = (offset + w) / this.speed
      translateX = (offset + w) * -1
    }

    // 设置el的property
    const propertyData = {
      color: this.color,
      // 对应的css var
      offset: offset + 'px',
      width: this.width + 'px',
      translateX: translateX + 'px',
      tunnel: this.tunnel,
      duration: duration + 's',
      'font-size': this.danmakuEngine.fontSize + 'px',
      // offsetY:
      //   this.tunnel * this.danmakuManager.fontSize +
      //   this.tunnel * this.danmakuManager.gap,
    }
    Object.entries(propertyData).forEach(([key, val]) => {
      if (!this.el) return
      this.el.style.setProperty(`--${key}`, val + '')
    })
  }

  onUnload(): void {
    this.el = undefined
    this.outTunnelObserveEl = undefined
  }
  onLeave() {
    this.reset()
    this.unload()
    this.danmakuEngine.runningDanmakus.delete(this)
  }
  reset() {
    if (!this.el) return
    if (!this.initd) return
    this.initd = false
    this.outTunnel = false
    this.disabled = false
    this.unbindEvent()

    this.container.removeChild(this.el)
  }
}
