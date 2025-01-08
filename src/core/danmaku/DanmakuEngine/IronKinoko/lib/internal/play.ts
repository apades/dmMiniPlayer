import Danmaku from '../danmaku'
import createEngine from '../engine/index'
import { raf } from '../utils'

export default function (this: Danmaku) {
  if (!this._.visible || !this._.paused) {
    return this
  }
  if (this.media) {
    if (this._.paused) {
      this._.paused = false
      this.refresh()
    }
  }

  this._.paused = false

  const engine = createEngine(
    this._.engine.setup,
    this._.engine.render,
    this._.engine.remove,
  ).bind(this)

  const frame = () => {
    engine()
    this._.requestID = raf(frame)
  }
  this._.requestID = raf(frame)
  return this
}
