import type { DanmakuType } from './danmaku-type'

export interface BasicDanmakuData {
  content: string
  time: string
  type: string
  fontSize: string
  color: string
}
export class Danmaku {
  content: string
  time: string
  startTime: number
  type: DanmakuType
  fontSize: number
  color: number
  constructor({ content, time, type, fontSize, color }: BasicDanmakuData) {
    this.content = content
    this.time = time
    this.startTime = Number.parseFloat(time)
    this.type = Number.parseInt(type)
    this.fontSize = Number.parseFloat(fontSize)
    this.color = Number.parseInt(color)
  }
}
