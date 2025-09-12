import { type KeyboardEvent } from 'react'
export let checkJumpInBufferArea = (buffered: TimeRanges, time: number) => {
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.start(i) <= time && buffered.end(i) >= time) return true
  }
  return false
}

type noop = (this: any, ...args: any[]) => any
export function handleOnPressEnter<T extends (e: KeyboardEvent) => void>(
  cb: T,
): (e: KeyboardEvent) => void {
  return (e) => {
    e.stopPropagation()
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') {
      e.preventDefault()
      return cb(e)
    }
  }
}
