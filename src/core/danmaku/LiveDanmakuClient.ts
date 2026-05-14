import Events2 from '@root/utils/Events2'
import { type DanmakuInitData } from './DanmakuEngine'

export type LiveEvent = {
  'danmaku-add': {
    color: string
    text: string
    imageMap?: Record<
      string,
      {
        url: string
        width: number
        height: number
      }
    >
  }
}

export default abstract class LiveDanmakuClient<
  Data = any,
> extends Events2<LiveEvent> {
  constructor() {
    super()
  }
  abstract onGettingLiveDanmakuData(data: Data): DanmakuInitData[]
  abstract close(): void
}
