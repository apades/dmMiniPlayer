import { eventBus, EventBus } from '@root/core/event'
import { KeyBinding } from '@root/core/KeyBinding'
import { PlayerComponents } from '@root/core/player-component'
import VideoPlayerBase from '@root/core/VideoPlayer/VideoPlayerBase'
import { createContext, Dispatch, SetStateAction } from 'react'

export type ContextData = {
  webVideo?: HTMLVideoElement | null
  videoPlayerRef: { current: HTMLDivElement | null }
  // 使用webVideo替换video标签
  useWebVideo?: boolean
  keydownWindow?: Window

  isLive?: boolean

  playerComponents: PlayerComponents

  eventBus: EventBus
  videoPlayer: VideoPlayerBase
  videoStream?: MediaStream
  keyBinding: KeyBinding
  setContext: Dispatch<SetStateAction<ContextData>>
}

let keyBinding = new KeyBinding()
window.keyBinding = keyBinding
export const defaultVpContext: ContextData = {
  eventBus,
  keyBinding,
  videoPlayer: null as any,
  videoPlayerRef: { current: null },
  playerComponents: {} as any,
  setContext: () => {},
}

const vpContext = createContext<ContextData>(defaultVpContext)

export default vpContext
