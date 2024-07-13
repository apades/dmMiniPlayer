export enum PlayerEvent {
  close = 'close',
  open = 'open',
  resize = 'resize',
}

export type NativeCustomEvent = {
  /**关闭PIP窗口时 */
  play: void
  pause: void
  seek: void
  aaa: void
} & {
  // - 新的事件
  [key in PlayerEvent]: void
}

export type PlayerEvents = NativeCustomEvent
