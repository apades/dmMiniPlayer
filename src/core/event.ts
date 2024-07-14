export enum PlayerEvent {
  close = 'close',
  open = 'open',
  resize = 'resize',
  /**web的video dom被替换成别的video dom时 */
  webVideoChanged = 'webVideoChanged',
}

export type NativeCustomEvent = {
  /**关闭PIP窗口时 */
  play: void
  pause: void
  seek: void
  /**web的video dom被替换成别的video dom时 */
  webVideoChanged: HTMLVideoElement
} & {
  // - 新的事件
  [key in PlayerEvent]: void
}

export type PlayerEvents = NativeCustomEvent
