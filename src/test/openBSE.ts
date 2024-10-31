import openBSEEngine from '@root/core/danmaku/DanmakuEngine/openBSEDanmaku/lib/engines/generalEngine'
import { dq1 } from '@root/utils'
import '@root/style'

const engine = new openBSEEngine(dq1('#app')!, {})
window.engine = engine

engine.play()

const getTime = (range: number) => Math.random() * 1000 * range
new Array(200).fill(0).forEach((_, i) => {
  engine.add({
    text: `aaa${i}`,
    startTime: getTime(10),
  })
})
