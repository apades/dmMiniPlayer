import type Danmaku from './danmaku'
import type { InnerComment, Comment } from './types'

export const raf =
  window.requestAnimationFrame ||
  // @ts-ignore
  window.mozRequestAnimationFrame ||
  // @ts-ignore
  window.webkitRequestAnimationFrame ||
  ((cb) => setTimeout(cb, 50 / 3))

export const caf =
  window.cancelAnimationFrame ||
  // @ts-ignore
  window.mozCancelAnimationFrame ||
  // @ts-ignore
  window.webkitCancelAnimationFrame ||
  clearTimeout

export function binsearch(arr: any[], prop: string, key: any) {
  let mid = 0
  let left = 0
  let right = arr.length
  while (left < right - 1) {
    mid = (left + right) >> 1
    if (key >= arr[mid][prop]) {
      left = mid
    } else {
      right = mid
    }
  }
  if (arr[left] && key < arr[left][prop]) {
    return left
  }
  return right
}

export function transComment(comments?: Comment[]): InnerComment[] {
  return [...(comments || [])]
    .sort((a, b) => a.time - b.time)
    .map((cmt) => ({ ...cmt, mode: cmt.mode ?? 'rtl' }))
}

function collidableRange() {
  const max = 9007199254740991
  return [
    {
      range: 0,
      time: -max,
      width: max,
      height: 0,
      _: { currentTime: -max, maxLength: 0, duration: -1 },
    },
    {
      range: max,
      time: max,
      width: 0,
      height: 0,
      _: { currentTime: max, maxLength: 0, duration: -1 },
    },
  ]
}

export function resetSpace(space: any) {
  space.ltr = collidableRange()
  space.rtl = collidableRange()
  space.top = collidableRange()
  space.bottom = collidableRange()
  return space
}

export function bindEngine(this: Danmaku, engine: any) {
  const ret: any = {}
  for (const key in engine) {
    if (Object.hasOwnProperty.call(engine, key)) {
      const value = engine[key]
      if (typeof value === 'function') {
        ret[key] = value.bind(this)
      } else ret[key] = value
    }
  }
  return ret
}

export function clamp(lower: number, number: number, upper: number) {
  return Math.min(upper, Math.max(lower, number))
}
