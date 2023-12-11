import type { DanType } from '@root/danmaku'
import vpConfig from '@root/store/vpConfig'
import type { OrPromise } from '@root/utils/typeUtils'
import EventEmitter from 'events'
import { runInAction } from 'mobx'

export type LiveEvent = {
  danmu: Omit<DanType, 'time'>
  allDanmaku: DanType[]
}

export default abstract class BarrageClient extends EventEmitter {
  constructor() {
    super()
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
  async init() {
    this.onInit()
  }
  protected abstract onInit(): void
  close() {
    this.onClose()
    this.removeAllListeners()
  }
  protected abstract onClose(): void
}

export abstract class LiveBarrageClient extends BarrageClient {}
export abstract class VideoBarrageClient extends BarrageClient {
  onClose(): void {}
}
