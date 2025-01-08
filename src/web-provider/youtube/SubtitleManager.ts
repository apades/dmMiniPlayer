import SubtitleManager from '@root/core/SubtitleManager'
import type { SubtitleRow } from '@root/core/SubtitleManager/types'
import { runInAction } from 'mobx'
import { getSubtitles, getSubtitle } from './utils'
import configStore from '@root/store/config'

export default class YoutubeSubtitleManager extends SubtitleManager {
  onInit() {
    runInAction(async () => {
      this.subtitleItems.length = 0
      this.subtitleItems = await getSubtitles(location.href)
    })
  }
  async loadSubtitle(value: string): Promise<SubtitleRow[]> {
    const subtitleRows = await getSubtitle(value)
    if (!configStore.youtube_mergeSubtitleAtSimilarTimes) return subtitleRows

    const newSubtitleRows: SubtitleRow[] = []

    const existSet = new Set<SubtitleRow>()
    for (let i = 0; i < subtitleRows.length; i++) {
      const row = subtitleRows[i],
        lastRow = subtitleRows[i + 1]

      if (!row) break

      if (lastRow && lastRow.startTime <= row.endTime) {
        const newRow: SubtitleRow = {
          ...row,
          startTime: row.startTime,
          endTime: row.endTime,
          text: row.text + '\n' + lastRow.text,
          htmlText: row.text + '\n' + lastRow.text,
        }
        newSubtitleRows.push(newRow)
        i++
      } else {
        newSubtitleRows.push(row)
        existSet.add(row)
      }
    }

    return newSubtitleRows
  }
}
