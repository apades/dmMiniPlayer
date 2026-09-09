import Events2 from '@root/utils/Events2'

export type LiveEvent = {
  danmu: {
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
  /** ws 弹幕初始化失败，可据此降级到其他弹幕来源 */
  failed: undefined
}

export default abstract class BarrageClient extends Events2<LiveEvent> {
  constructor() {
    super()
  }
  abstract close(): void
}
