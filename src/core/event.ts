import { onceCall } from '@root/utils'
import Events2 from '@root/utils/Events2'
import mitt from 'mitt'
import { Merge } from 'type-fest'
import { toast } from 'react-hot-toast'

export enum PlayerEvent {
  play = 'play',
  pause = 'pause',
  close = 'close',
  open = 'open',
  resize = 'resize',
  seeked = 'seeked',
  changeCurrentTimeByKeyboard = 'currentTimeJump',
  changeCurrentTimeByKeyboard_fine = 'currentTimeJump_fine',
  /**web的video dom被替换成别的video dom时 */
  webVideoChanged = 'webVideoChanged',

  command_playToggle = 'command_playToggle',
  // command_rewind = 'command_rewind',
  // command_forward = 'command_forward',
  command_fineRewind = 'command_fineRewind',
  command_fineForward = 'command_fineForward',
  command_volumeUp = 'command_volumeUp',
  command_volumeDown = 'command_volumeDown',
  command_muteToggle = 'command_muteToggle',
  command_danmakuVisible = 'command_danmakuVisible',
  command_subtitleVisible = 'command_subtitleVisible',
  command_speedUp = 'command_speedUp',
  command_speedDown = 'command_speedDown',
  command_speedToggle = 'command_speedToggle',
  // command_pressSpeedMode = 'command_pressSpeedMode',
  command_screenshot = 'command_screenshot',
  command_danmakuShowInput = 'command_danmakuShowInput',

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

  toast = 'toast',
}

type ToastArgs = Parameters<typeof toast>

type OverrideArgsEvent = {
  /**web的video dom被替换成别的video dom时 */
  webVideoChanged: HTMLVideoElement
  toast:
    | string
    | (ToastArgs[1] & {
        msg: string
        type: 'error' | 'success' | 'loading' | 'custom'
      })
    | {
        type: 'remove' | 'dismiss'
        id: string
      }
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
