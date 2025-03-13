import SubtitleManager from '@root/core/SubtitleManager'
import type { SubtitleRow } from '@root/core/SubtitleManager/types'
import { runInAction } from 'mobx'
import { getSubtitle, getSubtitles } from '../utils'

export default class BilibiliSubtitleManager extends SubtitleManager {
  onInit() {
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
