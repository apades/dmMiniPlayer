import { Danmaku } from './'

export type DanmakuMoveType = 'top' | 'right' | 'bottom'

export type DanmakuInitData = {
  id?: string
  text: string
  time?: number
  color: string
  type: DanmakuMoveType
}
export type DanmakuManagerEvents = {
  'danmaku-enter': Danmaku
  'danmaku-leaveTunnel': Danmaku
  'danmaku-leave': Danmaku
}
