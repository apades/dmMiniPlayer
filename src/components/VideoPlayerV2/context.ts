import { KeyBinding } from '@root/core/KeyBinding'
import type { SideSwitcher } from '@root/core/SideSwitcher'
import type SubtitleManager from '@root/core/SubtitleManager'
import type VideoPlayerBase from '@root/core/VideoPlayer/VideoPlayerBase'
import type VideoPreviewManager from '@root/core/VideoPreviewManager'
import type { DanmakuEngine } from '@root/core/danmaku/DanmakuEngine'
import type DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { type EventBus, eventBus } from '@root/core/event'
import { createElement } from '@root/utils'
import { type Dispatch, type SetStateAction, createContext } from 'react'

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
  videoPreviewManger?: VideoPreviewManager
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
