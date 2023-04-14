// 这里定义那些event
export type TProtocolMap = {
  /**去除某一个dom的所有事件 */
  'event-hacker:disable': { qs: string; event: string }
}
