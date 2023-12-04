import type { DanType } from '@root/danmaku'
import vpConfig from '@root/store/vpConfig'
import EventEmitter from 'events'
import { runInAction } from 'mobx'

export type LiveEvent = {
  danmu: Omit<DanType, 'time'>
}

export default abstract class BarrageClient extends EventEmitter {
  constructor() {
    super()
    runInAction(() => {
      vpConfig.showDanmakus = true
    })
  }
  addEventListener<TType extends keyof LiveEvent>(
    e: TType,
    cb: (data: LiveEvent[TType]) => void
  ) {
    return super.addListener(e as string, cb)
  }
  emit<TType extends keyof LiveEvent>(
    eventName: TType,
    args: LiveEvent[TType]
  ): boolean {
    return super.emit(eventName, args)
  }
  abstract close(): void
}
