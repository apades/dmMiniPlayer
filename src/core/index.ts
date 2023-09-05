import configStore from '@root/store/config'
import DocMiniPlayer from './DocMiniPlayer'
import MiniPlayer, { type MiniPlayerProps } from './miniPlayer'

export function getMiniPlayer(props: MiniPlayerProps): MiniPlayer {
  if (configStore.useDocPIP) return new DocMiniPlayer(props)
  return new MiniPlayer(props)
}
