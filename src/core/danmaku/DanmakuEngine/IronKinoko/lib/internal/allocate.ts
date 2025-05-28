import type Danmaku from '../danmaku'
import type { RunningComment, RunningCommentRange } from '../types'

export default function (this: Danmaku, cmt: RunningComment) {
  const currentTime = this._.currentTime
  const willCollide = (cr: RunningComment, cmt: RunningComment) => {
    if (cmt.mode === 'top' || cmt.mode === 'bottom') {
      return currentTime - cr.time < cmt._.fullDuration
    }

    const offset =
      ((currentTime - cr.time) / cr._.fullDuration) * cr._.fullWidth

    if (cr.width > offset) {
      return true
    }
    // 从右往左，计算追尾时间
    //   cmtGoal   crGoal  screen                                    <--start
    // --|---------|-------|-------------------------------------------------
    //             |       .<-   crLeftWidth   ->|<--cr-->|
    //   |                 .<-   cmtLeftWidth               ->|<----cmt---->|

    const crWidth = cr.width
    const crDuration = cr._.fullDuration - (currentTime - cr.time)
    const crLeftWidth =
      (cr._.fullWidth * crDuration) / cr._.fullDuration - cr.width
    const crSpeed = cr._.fullWidth / cr._.fullDuration

    const cmtDuration = cmt._.fullDuration - (currentTime - cmt.time)
    const cmtLeftWidth =
      (cmt._.fullWidth * cmtDuration) / cmt._.fullDuration - cmt.width
    const cmtSpeed = cmt._.fullWidth / cmt._.fullDuration

    // cmt 速度大，且有差距时才会发生碰撞，
    return cmtLeftWidth > crLeftWidth + crWidth
      ? cmtSpeed > crSpeed
        ? crDuration >
          (cmtLeftWidth - (crLeftWidth + crWidth)) / (cmtSpeed - crSpeed)
        : false
      : true
  }
  const crs = this._.space[cmt.mode]
  let last = 0
  let curr = 0
  for (let i = 1; i < crs.length; i++) {
    const cr = crs[i]
    let requiredRange = cmt.height
    if (cmt.mode === 'top' || cmt.mode === 'bottom') {
      requiredRange += cr.height
    }
    if (cr.range - cr.height - crs[last].range >= requiredRange) {
      curr = i
      break
    }
    if (willCollide(cr, cmt)) {
      last = i
    }
  }
  const channel = crs[last].range
  const crObj = {
    range: channel + cmt.height,
    time: cmt.time,
    text: cmt.text,
    width: cmt.width,
    height: cmt.height,
    _: cmt._,
  } as RunningCommentRange

  let areaHeight = this._.stage.height - cmt.height
  if (cmt.mode === 'ltr' || cmt.mode === 'rtl') {
    areaHeight = areaHeight * this._.scrollAreaPercent
  }
  // cmt can't overlap, return false to remove cmt
  if (!this._.overlap && channel > areaHeight) return null

  crs.splice(last + 1, curr - last - 1, crObj)

  return this._.overlap ? channel % areaHeight : channel
}
