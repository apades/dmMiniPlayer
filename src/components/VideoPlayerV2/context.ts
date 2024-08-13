import { eventBus, EventBus } from '@root/core/event'
import { createContext } from 'react'

export type ContextData = {
  webVideo?: HTMLVideoElement | null
  // 使用webVideo替换video标签
  useWebVideo?: boolean
  keydownWindow?: Window

  isLive?: boolean

  eventBus: EventBus
}

export const defaultVpContext: ContextData = {
  eventBus,
}

const vpContext = createContext<ContextData>(defaultVpContext)

export default vpContext
