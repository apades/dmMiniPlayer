import { PlayerComponent } from '@root/core/types'
import { v1 as uuid } from 'uuid'
import { DanmakuInitData, DanmakuEngine, DanmakuMoveType } from '.'

export type DanmakuInitProps = {
  initTime?: number
}
export default class DanmakuBase implements DanmakuInitData, PlayerComponent {
  id: string
  color: string
  text: string
  time: number
  type: DanmakuMoveType
  width: number = 0
  tunnel: number = 0
  /**实际init的time，用来video seek用的 */
  initTime: number = 0

  initd = false
  outTunnel = false

  disabled = false

  get speed() {
    return this.danmakuEngine.speed
  }

  get container() {
    return this.danmakuEngine.container
  }

  danmakuEngine: DanmakuEngine

  constructor(
    props: DanmakuInitData & {
      danmakuEngine: DanmakuEngine
    }
  ) {
    props.id = props.id || uuid()
    this.id = props.id
    this.danmakuEngine = props.danmakuEngine
    this.color = props.color
    this.text = props.text
    this.time = props.time || 0
    this.type = props.type

    if (this instanceof props.danmakuEngine.Danmaku) {
      return this
    }

    return new props.danmakuEngine.Danmaku(props)
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
