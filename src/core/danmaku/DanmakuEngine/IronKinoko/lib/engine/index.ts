import { Comment } from '..'
import Danmaku from '../danmaku'
import allocate from '../internal/allocate'
import type { RunningComment, Stage } from '../types'

export default function (
  setup: (stage: Stage, comments: Comment[]) => RunningComment[],
  render: (arg0: { cmt: RunningComment; playbackRate: number }) => void,
  remove: (stage: Stage, cmt: RunningComment) => void,
) {
  return function (this: Danmaku) {
    const currentTime = this._.currentTime
    const playbackRate = this.media ? this.media.playbackRate : 1
    for (let i = this._.runningList.length - 1; i >= 0; i--) {
      const cmt = this._.runningList[i]
      const cmtTime = cmt.time
      if (currentTime - cmtTime > cmt._.fullDuration) {
        remove(this._.stage, cmt)
        this._.runningList.splice(i, 1)
      }
    }
    const pendingList = []
    while (this._.position < this.comments.length) {
      const cmt = this.comments[this._.position]
      const cmtTime = cmt.time
      if (cmtTime >= currentTime) {
        break
      }

      if (currentTime - cmtTime > this._.duration) {
        ++this._.position
        continue
      }
      pendingList.push(cmt)
      ++this._.position
    }
    const runningComments = setup(this._.stage, pendingList)

    runningComments.forEach((cmt) => {
      const y = allocate.call(this, cmt)
      if (y === null) {
        remove(this._.stage, cmt)
        return
      }
      cmt.y = y
      render({ cmt, playbackRate })
      this._.runningList.push(cmt)
    })
  }
}
