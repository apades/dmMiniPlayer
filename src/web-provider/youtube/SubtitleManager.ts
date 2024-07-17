import SubtitleManager from '@root/core/SubtitleManager'
import type { SubtitleRow } from '@root/core/SubtitleManager/types'
import { runInAction } from 'mobx'
import { getSubtitles, getSubtitle } from './utils'

export default class YoutubeSubtitleManager extends SubtitleManager {
  onInit() {
    runInAction(async () => {
      this.subtitleItems.length = 0
      this.subtitleItems.push(...(await getSubtitles()))
    })
  }
  async loadSubtitle(value: string): Promise<SubtitleRow[]> {
    return getSubtitle(value)
  }
}
