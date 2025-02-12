/**
 * 参考自 {@link https://github.com/IronKinoko/agefans-enhance/blob/bd214fc/src/player/plugins/danmaku/progressBarPower.ts#L9}
 */

import { DanmakuBase } from '@root/core/danmaku/DanmakuEngine'
import { FC, useContext } from 'react'
import vpContext from '../context'

type Point = { x: string; y: string }
function createProgressBarPower(duration: number, comments: DanmakuBase[]) {
  const data = comments.map((cmt) => cmt.time!)
  // svg总长度
  const svgMaxLength = 1000
  // 分成 size 份
  const size = 100
  // svg步长
  const stepLength = svgMaxLength / size

  // 每份时间多长
  const stepTime = duration / size
  const counts = []
  let i = 0,
    j = 0
  // 统计的每份基础时间里弹幕数量
  while (i++ <= size) {
    const base = stepTime * i
    let count = 0
    while (data[j++] < base) {
      count++
    }
    counts.push(count)
  }

  // 为了美观，100 高度的 svg，底部 20 预留显示出来，其他从 80 开始算
  let start = 'M 0 100, L '
  let end = ' 1000.0 80.0 L 1000 100 Z'

  // 巅峰弹幕数量
  const maxCount = Math.max(Math.max(...counts), 1)

  const points: Point[] = []
  counts.forEach((count, i) => {
    const x = i * stepLength
    const y = (1 - count / maxCount) * 80

    // 做一份相同的数据，让曲线在两侧顺滑变化
    if (i !== 0)
      points.push({ x: (x - stepLength / 2).toFixed(2), y: y.toFixed(2) })
    if (i !== counts.length - 1)
      points.push({ x: x.toFixed(2), y: y.toFixed(2) })
  })

  for (let i = 0; i < points.length; ) {
    const p1 = points[i++] // data point
    const p2 = points[i++] // mid point
    start += `${p1.x} ${p1.y} C ${p2.x} ${p1.y}, ${p2.x} ${p2.y},`
  }

  return start + end
}

const DanmakuProgressBarPower: FC = (props) => {
  const { danmakuEngine, isLive } = useContext(vpContext)

  if (isLive) return
  if (!danmakuEngine) return
}
