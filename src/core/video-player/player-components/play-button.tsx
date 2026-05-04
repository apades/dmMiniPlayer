import { PlayerComponent, PlayerComponentActions } from './player-component'

export class PlayButton extends PlayerComponent<PlayButton> {
  name = 'play-button' as const
  override readonly __actions = {
    togglePaused: 'toggle-play',
  } as const

  togglePaused() {}
}

let a: PlayButton['name'] = 'play-button'

declare global {
  interface DM_ACTIONS extends PlayerComponentActions<PlayButton> {}
}
