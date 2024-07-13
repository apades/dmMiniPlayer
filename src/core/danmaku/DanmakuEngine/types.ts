import { DanmakuBase } from './'

export type DanmakuMoveType = 'top' | 'right' | 'bottom'

export type DanmakuInitData = {
  id?: string
  text: string
  time?: number
  color: string
  type: DanmakuMoveType
}
export type DanmakuEngineEvents = {
  'danmaku-enter': DanmakuBase
  'danmaku-leaveTunnel': DanmakuBase
  'danmaku-leave': DanmakuBase
}
