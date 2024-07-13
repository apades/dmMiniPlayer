import vpConfig from '@root/store/vpConfig'
import Events2 from '@root/utils/Events2'
import { runInAction } from 'mobx'

export type LiveEvent = {
  danmu: { color: string; text: string }
}

export default abstract class BarrageClient extends Events2<LiveEvent> {
  constructor() {
    super()
    runInAction(() => {
      vpConfig.showBarrage = true
    })
  }
  addEventListener<TType extends keyof LiveEvent>(
    e: TType,
    cb: (data: LiveEvent[TType]) => void
  ) {
    return this.on(e, cb)
  }
  abstract close(): void
}
