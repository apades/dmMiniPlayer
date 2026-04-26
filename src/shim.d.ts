import { ProtocolWithReturn } from 'webext-bridge'
import { Props as DanmakuGetterProps } from '@pkgs/danmakuGetter/DanmakuGetter'
import WebextEvent from './shared/webextEvent'
import { DanmakuInitData } from './core/danmaku/DanmakuEngine'
import type { manifest } from './manifest'

type Command = keyof typeof manifest.commands

declare module 'webext-bridge' {
  export interface ProtocolMap {
    [WebextEvent.bgFetch]: ProtocolWithReturn<
      {
        url: string
        options?: RequestInit & {
          /**默认json */
          type?: 'json' | 'text' | 'blob'
        }
      },
      any
    >
    [WebextEvent.setGetDanmaku]: ProtocolWithReturn<
      DanmakuGetterProps,
      { id: string }
    >
    [WebextEvent.getDanmaku]: {
      data?: DanmakuInitData[]
      err?: string
      config?: { duration?: number }
    }
    [WebextEvent.stopGetDanmaku]: { id: string }
    [WebextEvent.needClickWebToOpenPIP]: void
    [WebextEvent.startTabCapture]: ProtocolWithReturn<
      null,
      { streamId?: string; error?: string }
    >
    [WebextEvent.getTabCapturePermission]: ProtocolWithReturn<null, boolean>
    [WebextEvent.requestInitPlayerFromExtPopup]: ProtocolWithReturn<
      null,
      | { state: 'ok' }
      | { state: 'error'; errType: 'no-video' | 'user-activation' }
      | { state: string; errType?: string }
    >
    [WebextEvent.openSetting]: void
    [WebextEvent.moveDocPIPPos]: { x: number; y: number; docPIPWidth: number }
    [WebextEvent.resizeDocPIP]: {
      width: number
      height: number
      docPIPWidth: number
    }
    [WebextEvent.updateDocPIPRect]: {
      docPIPWidth: number
    } & Partial<{ left: number; top: number; width: number; height: number }>

    [WebextEvent.afterStartPIP]: { width: number }

    [WebextEvent.reloadPage]: null
    [WebextEvent.setExtActive]: { active: boolean }
    [WebextEvent.extCommand]: { command: Command }
  }
}
