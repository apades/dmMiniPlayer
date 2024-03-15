import SubtitleManager from '@root/core/SubtitleManager'
import type { SubtitleRow } from '@root/core/SubtitleManager/types'
import { getSubtitle, getSubtitles } from '../utils'
import { runInAction } from 'mobx'

export default class BilibiliSubtitleManager extends SubtitleManager {
  initSubtitles() {
    this.reset()
    runInAction(async () => {
      this.subtitleItems.length = 0
      this.subtitleItems.push(...(await getSubtitles()))
    })
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
