import type { ProtocolWithReturn } from '@root/utils/Messager'

type EventHackerProps =
  | {
      qs: 'document'
      event: keyof DocumentEventMap
    }
  | {
      qs: 'window'
      event: keyof WindowEventMap
    }
  | {
      qs: string
      event: keyof HTMLElementEventMap
    }

// TODO 修改messager结构，现在onMessage都需要返回肯定不行
// 这里定义那些event
export type TProtocolMap = {
  /**去除某一个dom的所有事件 */
  'event-hacker:disable': EventHackerProps
  'event-hacker:listenEventAdd': EventHackerProps
  'event-hacker:onEventAdd': EventHackerProps
  'event-hacker:enable': EventHackerProps

  'fetch-hacker:add': RegExp
  'fetch-hacker:remove': RegExp
  'fetch-hacker:onTrigger': ProtocolWithReturn<
    null | { url: string; args: any[]; res: any },
    { url: string; args: any[]; res: any }
  >

  'run-code': ProtocolWithReturn<{ function: string; args?: any[] }, any>
  'get-data': ProtocolWithReturn<{ keys: string[] }, any>
  'inject-api:run': ProtocolWithReturn<
    { origin: string; keys: string[]; onTriggerEvent: string },
    any
  >
  'inject-api:onTrigger': ProtocolWithReturn<
    null | { event: string; args: any[] },
    { event: string; args: any[] }
  >

  'msg-test': ProtocolWithReturn<any, any>
  'start-PIP-capture-displayMedia': {
    cropTarget: any
    duration: number
    currentTime: number
    isPause: boolean
    x: number
    y: number
    w: number
    h: number
    vw: number
    vh: number
  }
}
