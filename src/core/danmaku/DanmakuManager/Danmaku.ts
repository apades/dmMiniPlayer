import { PlayerComponent } from '@root/core/types'
import { v1 as uuid } from 'uuid'
import { DanmakuInitData, DanmakuManager, DanmakuMoveType } from './'

IntersectionObserver
export type DanmakuInitProps = {
  initTime?: number
}
export default class Danmaku implements DanmakuInitData, PlayerComponent {
  id: string
  color: string
  text: string
  time: number
  type: DanmakuMoveType
  width: number
  tunnel: number
  /**实际init的time，用来video seek用的 */
  initTime: number

  initd = false
  outTunnel = false

  disabled = false

  get speed() {
    return this.danmakuManager.speed
  }

  get container() {
    return this.danmakuManager.container
  }
  // 弹幕el: text_<s></s>
  // 通过用IntersectionObserver监听<s>是否enter或leave，占领/释放弹幕tunnel
  // TODO 还需要解决缩放后一个tunnel还有2个以上变化到leave，第一个enter并leave，那第二个会跟新danmakus冲突的情况
  el: HTMLElement
  /**给tunnelManager监听 */
  outTunnelObserveEl: HTMLSpanElement

  danmakuManager: DanmakuManager

  constructor(
    props: DanmakuInitData & {
      danmakuManager: DanmakuManager
    }
  ) {
    props.id = props.id || uuid()
    Object.assign(this, props)
    if (this instanceof props.danmakuManager.Danmaku) {
      return this
    }

    return new props.danmakuManager.Danmaku(props)
  }
  onInit(props: DanmakuInitProps) {}
  onUnload() {}
  unload() {
    this.onUnload()
  }

  init(props: DanmakuInitProps) {
    if (this.initd) return
    this.onInit(props)
  }

  updateState() {}
  reset() {}
}
