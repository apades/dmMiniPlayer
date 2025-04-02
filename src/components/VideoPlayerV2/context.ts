import { DanmakuEngine } from '@root/core/danmaku/DanmakuEngine'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { eventBus, EventBus } from '@root/core/event'
import { KeyBinding } from '@root/core/KeyBinding'
import { SideSwitcher } from '@root/core/SideSwitcher'
import SubtitleManager from '@root/core/SubtitleManager'
import VideoPlayerBase from '@root/core/VideoPlayer/VideoPlayerBase'
import { createElement } from '@root/utils'
import { createContext, Dispatch, SetStateAction } from 'react'

export type ContextData = {
  webVideo?: HTMLVideoElement | null
  videoPlayerRef: { current: HTMLDivElement | null }
  // 使用webVideo替换video标签
  useWebVideo?: boolean
  keydownWindow?: Window

  isLive?: boolean

  eventBus: EventBus
  videoPlayer: VideoPlayerBase
  subtitleManager?: SubtitleManager
  danmakuEngine?: DanmakuEngine
  danmakuSender?: DanmakuSender
  sideSwitcher?: SideSwitcher
  videoStream?: MediaStream
  keyBinding: KeyBinding
  setContext: Dispatch<SetStateAction<ContextData>>
}

export const defaultVpContext: ContextData = {
  eventBus,
  keyBinding: new KeyBinding(),
  videoPlayer: null as any,
  videoPlayerRef: { current: null },
  setContext: () => {},
}

const vpContext = createContext<ContextData>(defaultVpContext)

export default vpContext
