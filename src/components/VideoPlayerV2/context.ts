import { DanmakuEngine } from '@root/core/danmaku/DanmakuEngine'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { eventBus, EventBus } from '@root/core/event'
import { SideSwitcher } from '@root/core/SideSwitcher'
import SubtitleManager from '@root/core/SubtitleManager'
import VideoPlayerBase from '@root/core/VideoPlayer/VideoPlayerBase'
import { createContext } from 'react'

export type ContextData = {
  webVideo?: HTMLVideoElement | null
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
}

export const defaultVpContext: ContextData = {
  eventBus,
  videoPlayer: null as any,
}

const vpContext = createContext<ContextData>(defaultVpContext)

export default vpContext
