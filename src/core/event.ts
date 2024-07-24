import { onceCall } from '@root/utils'
import Events2 from '@root/utils/Events2'
import mitt, { WildcardHandler, Handler } from 'mitt'
import { Merge } from 'type-fest'

export enum PlayerEvent {
  play = 'play',
  pause = 'pause',
  close = 'close',
  open = 'open',
  resize = 'resize',
  seeked = 'seeked',
  /**web的video dom被替换成别的video dom时 */
  webVideoChanged = 'webVideoChanged',

  // danmakuEngine
  danmakuEngineBeforeInit = 'danmakuEngineBeforeInit',
  danmakuEngineInitd = 'danmakuEngineInitd',
  danmakuEngineBeforeUnload = 'danmakuEngineBeforeUnload',
  danmakuEngineUnloaded = 'danmakuEngineUnloaded',

  // videoPlayer
  videoPlayerBeforeInit = 'videoPlayerBeforeInit',
  videoPlayerInitd = 'videoPlayerInitd',
  videoPlayerBeforeUnload = 'videoPlayerBeforeUnload',
  videoPlayerUnloaded = 'videoPlayerUnloaded',
}

type OverrideArgsEvent = {
  /**web的video dom被替换成别的video dom时 */
  webVideoChanged: HTMLVideoElement
}

export type PlayerEvents = Merge<
  {
    // - 新的事件
    [key in PlayerEvent]: void
  },
  OverrideArgsEvent
>

const getMitt = onceCall(() => mitt())
export class EventBus extends Events2<PlayerEvents> {
  mitt = getMitt() as any
  // static EventBus: EventBus
  // constructor() {
  //   super()
  //   if (EventBus.EventBus) return EventBus.EventBus
  //   else {
  //     EventBus.EventBus = this
  //   }
  // }
  // private listensMap = new WeakMap<
  //   (...args: any) => void,
  //   { string: (...args: any) => void }
  // >()
  // on<Key extends keyof PlayerEvents>(
  //   type: Key,
  //   handler: Handler<PlayerEvents[Key]>
  // ): void
  // on(type: '*', handler: WildcardHandler<PlayerEvents>): void
  // on(type: any, handler: any) {
  //   return this.mitt.on(type, handler)
  // }
  // on2<Key extends keyof PlayerEvents>(
  //   type: Key,
  //   handler: Handler<PlayerEvents[Key]>
  // ): () => void {
  //   this.mitt.on(type, handler)
  //   const unListen = () => {
  //     this.mitt.off(type, handler)
  //   }
  //   return unListen
  // }
  // off<Key extends keyof PlayerEvents>(
  //   type: Key,
  //   handler?: Handler<PlayerEvents[Key]>
  // ): void
  // off(type: '*', handler: WildcardHandler<PlayerEvents>): void
  // off(type: any, handler: any) {
  //   return this.mitt.off(type, handler)
  // }
  // offAllThis() {}
}
