import Danmaku from '../danmaku'
import { caf } from '../utils'

export default function (this: Danmaku) {
  if (!this._.visible || this._.paused) {
    return this
  }
  this._.paused = true
  caf(this._.requestID)
  this._.requestID = 0
  this._.rafIds.forEach(caf)
  this._.rafIds.clear()
  this._.engine.pause({
    stage: this._.stage,
    comments: this._.runningList,
    currentTime: this._.currentTime,
  })
  return this
}
