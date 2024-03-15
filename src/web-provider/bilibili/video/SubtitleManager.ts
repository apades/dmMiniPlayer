import SubtitleManager from '@root/core/SubtitleManager'
import type { SubtitleRow } from '@root/core/SubtitleManager/types'
import { getSubtitle, getSubtitles } from '../utils'

export default class BilibiliSubtitleManager extends SubtitleManager {
  async initSubtitles() {
    this.reset()
    this.subtitleItems = await getSubtitles()
  }
  async loadSubtitle(value: string): Promise<SubtitleRow[]> {
    const subtitleRes = await getSubtitle(value)
    return subtitleRes.body.map((d, i) => {
      return {
        endTime: d.to,
        startTime: d.from,
        htmlText: d.content,
        id: i + '',
        text: d.content,
      }
    })
  }
}
