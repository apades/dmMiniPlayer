import { ProtocolWithReturn } from '@root/utils/Messager'

// TODO 修改messager结构，现在onMessage都需要返回肯定不行
// 这里定义那些event
export type TProtocolMap = {
  /**去除某一个dom的所有事件 */
  'event-hacker:disable': { qs: string; event: string }
  'fetch-hacker:add': RegExp
  'fetch-hacker:remove': RegExp
  'fetch-hacker:onTrigger': ProtocolWithReturn<
    null | { url: string; args: any[]; res: any },
    { url: string; args: any[]; res: any }
  >

  'run-code': ProtocolWithReturn<{ function: string; args?: any[] }, any>
  'msg-test': ProtocolWithReturn<any, any>
}
