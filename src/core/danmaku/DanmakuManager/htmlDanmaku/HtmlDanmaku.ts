import { addEventListener, createElement, getTextWidth } from '@root/utils'
import { Danmaku } from '../'
import type { DanmakuInitProps } from '../Danmaku'

export default class HtmlDanmaku extends Danmaku {
  onInit(props: DanmakuInitProps): void {
    this.tunnel = this.danmakuManager.tunnelManager.getTunnel(this)
    if (this.tunnel == -1) {
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

    this.danmakuManager.emit('danmaku-enter', this)
    this.bindEvent()
    this.initd = true
  }

  private unbindEvent = () => {}
  private bindEvent() {
    switch (this.type) {
      case 'right': {
        const unbind1 = addEventListener(this.el, (el) => {
          el.addEventListener('animationend', () => {
            this.danmakuManager.emit('danmaku-leave', this)
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
            this.danmakuManager.emit('danmaku-leaveTunnel', this)
            this.danmakuManager.tunnelManager.popTunnel(this)
            this.danmakuManager.emit('danmaku-leave', this)
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
      fontSize: this.danmakuManager.fontSize + 'px',
      fontFamily: this.danmakuManager.fontFamily,
      fontWeight: this.danmakuManager.fontWeight,
    })
    this.width = w

    const cw = this.container.clientWidth
    const initTimeOffset = this.initTime - this.time

    let duration = this.danmakuManager.unmovingDanmakuSaveTime - initTimeOffset,
      offset = cw - initTimeOffset * this.speed,
      translateX = 0
    if (this.type == 'right') {
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
      'font-size': this.danmakuManager.fontSize + 'px',
      // offsetY:
      //   this.tunnel * this.danmakuManager.fontSize +
      //   this.tunnel * this.danmakuManager.gap,
    }
    Object.entries(propertyData).forEach(([key, val]) => {
      this.el.style.setProperty(`--${key}`, val + '')
    })
  }

  onLeave() {
    this.danmakuManager.emit('danmaku-leave', this)
    this.reset()
    this.unload()
  }
  reset() {
    if (!this.initd) return
    this.initd = false
    this.outTunnel = false
    this.disabled = false
    this.unbindEvent()

    this.container.removeChild(this.el)
  }
}
