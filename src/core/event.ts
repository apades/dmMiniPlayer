import { onceCall } from '@root/utils'
import Events2 from '@root/utils/Events2'
import mitt from 'mitt'
import { Merge, ValueOf } from 'type-fest'
import { toast } from 'react-hot-toast'
import config_shortcut from '@root/store/config/shortcut'

export const PlayerCommand = Object.fromEntries(
  Object.keys(config_shortcut)
    .filter((v) => v !== 'shortcut_desc')
    .flatMap((key) => {
      const command = key.replace('shortcut_', 'command_')
      // add both command and command_release for each command
      return [
        [command, command],
        [`${command}_release`, `${command}_release`],
      ]
    }),
) as Record<
  | `command_${Extract<Exclude<keyof typeof config_shortcut, 'shortcut_desc'>, string> extends `shortcut_${infer T}` ? T : never}`
  | `command_${Extract<Exclude<keyof typeof config_shortcut, 'shortcut_desc'>, string> extends `shortcut_${infer T}` ? T : never}_release`,
  string
>
export const PlayerEvent = {
  play: 'play',
  pause: 'pause',
  close: 'close',
  open: 'open',
  resize: 'resize',
  seeked: 'seeked',
  changeCurrentTimeByKeyboard: 'currentTimeJump',
  changeCurrentTimeByKeyboard_fine: 'currentTimeJump_fine',
  /**web video dom replaced with another video dom */
  webVideoChanged: 'webVideoChanged',

  ...PlayerCommand,

  /** long press playback rate feature */
  longTabPlaybackRate: 'longTabPlaybackRate',
  longTabPlaybackRateEnd: 'longTabPlaybackRateEnd',

  // danmakuEngine
  danmakuEngineBeforeInit: 'danmakuEngineBeforeInit',
  danmakuEngineInitd: 'danmakuEngineInitd',
  danmakuEngineBeforeUnload: 'danmakuEngineBeforeUnload',
  danmakuEngineUnloaded: 'danmakuEngineUnloaded',

  // videoPlayer
  videoPlayerBeforeInit: 'videoPlayerBeforeInit',
  videoPlayerInitd: 'videoPlayerInitd',
  videoPlayerBeforeUnload: 'videoPlayerBeforeUnload',
  videoPlayerUnloaded: 'videoPlayerUnloaded',

  toast: 'toast',
  /** Video url changed without changing video element */
  videoSrcChanged: 'videoSrcChanged',

  volumeChanged: 'volumeChanged',
} as const

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
    [key in ValueOf<typeof PlayerEvent>]: void
  },
  OverrideArgsEvent
>

const getMitt = onceCall(() => mitt())
export class EventBus extends Events2<PlayerEvents> {
  override mitt = getMitt() as any
}

export const eventBus = new EventBus()
