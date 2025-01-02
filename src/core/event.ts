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
  changeCurrentTimeByKeyboard = 'currentTimeJump',
  /**web的video dom被替换成别的video dom时 */
  webVideoChanged = 'webVideoChanged',

  /**长按倍速功能 */
  longTabPlaybackRate = 'longTabPlaybackRate',
  longTabPlaybackRateEnd = 'longTabPlaybackRateEnd',

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
}

export const eventBus = new EventBus()
