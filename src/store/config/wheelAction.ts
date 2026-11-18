export enum WheelAction {
  volume = 'volume',
  seek = 'seek',
  none = 'none',
}

/** Pixel delta that counts as one mouse-wheel notch. */
const WHEEL_NOTCH_PX = 100
/** Firefox reports about 3 lines per notch. */
const WHEEL_LINES_PER_NOTCH = 3

type WheelDelta = {
  deltaY: number
  deltaMode: number
}

function toPixelDelta(e: WheelDelta) {
  switch (e.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return (e.deltaY / WHEEL_LINES_PER_NOTCH) * WHEEL_NOTCH_PX
    case WheelEvent.DOM_DELTA_PAGE:
      return e.deltaY * WHEEL_NOTCH_PX
    default:
      return e.deltaY
  }
}
