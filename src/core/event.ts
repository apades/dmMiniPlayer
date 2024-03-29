export type WebPlayerEvent = {
  // [k in `wp:${keyof HTMLVideoElementEventMap}`]: void
}
export type CanvasPlayerEvent = {
  // [k in `cp:${keyof HTMLVideoElementEventMap}`]: void
}

export type NativeCustomEvent = {
  /**关闭PIP窗口时 */
  PIPClose: void
  PIPOpen: void
  play: void
  pause: void
  seek: void
}

export type PlayerEvents = NativeCustomEvent &
  WebPlayerEvent &
  CanvasPlayerEvent
