import { DanmakuEngine } from '@root/core/danmaku/DanmakuEngine'
import {
  PlayerComponent,
  PlayerComponentActions,
  PlayerComponentInitialData,
} from './player-component'

export class DanmakuButton extends PlayerComponent<DanmakuButton> {
  name = 'danmaku-button'
  override readonly __actions = {
    toggleDanmakuVisible: 'toggle-danmaku-visible',
  } as const

  danmakuEngine: DanmakuEngine | undefined

  override setup(data: { danmakuEngine: new () => DanmakuEngine }) {
    const danmakuEngine = new data.danmakuEngine()
    this.danmakuEngine = danmakuEngine
  }
  override render() {
    return null
  }

  toggleDanmakuVisible() {}
}

declare global {
  interface DM_ACTIONS extends PlayerComponentActions<DanmakuButton> {}
  interface INTERFACE_PLAYER_COMPONENT_INITIAL_DATA
    extends PlayerComponentInitialData<DanmakuButton> {}
}
