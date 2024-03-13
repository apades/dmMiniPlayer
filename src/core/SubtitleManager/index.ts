import { makeAutoObservable } from 'mobx'
import type { SubtitleItem, SubtitleManagerEvents, SubtitleRow } from './types'
import Events2 from '@root/utils/Events2'
import { addEventListener } from '@root/utils'

abstract class SubtitleManager extends Events2<SubtitleManagerEvents> {
  subtitleItems: SubtitleItem[] = []
  video: HTMLVideoElement
  private subtitleCache: Record<string, { rows: SubtitleRow[] }> = {}
  /**正在使用的字幕rows */
  rows: SubtitleRow[] = []
  rowIndex = 0
  activeRows: Record<string, SubtitleRow> = {}

  /**停止监听所有video事件 */
  private videoUnListen = () => {}
  constructor(video: HTMLVideoElement) {
    super()
    makeAutoObservable(this, { video: false })
    this.video = video
  }

  private listenVideoEvents(video = this.video) {
    const rowUnListenMap = new Map<SubtitleRow, () => void>()
    const unListenRows = () => {
      ;[...rowUnListenMap.entries()].forEach(([row, unListen]) => {
        this.emit('row-leave', row)
        unListen()
      })
    }

    const mainUnListen = addEventListener(video, (video) => {
      video.addEventListener('timeupdate', () => {
        const cTime = video.currentTime
        while (true) {
          const row = this.rows[this.rowIndex]
          if (row.startTime >= cTime) {
            this.rowIndex++
            // 避免一进来的cTime是超过字幕endTime的
            if (row.endTime >= cTime) {
              continue
            }
            this.emit('row-enter', row)
            const rowUnListen = addEventListener(video, (video) => {
              video.addEventListener('timeupdate', () => {
                const cTime = video.currentTime
                if (row.endTime <= cTime) {
                  this.emit('row-leave', row)
                  rowUnListenMap.delete(row)
                  rowUnListen()
                }
              })
            })
            rowUnListenMap.set(row, rowUnListen)
          } else {
            break
          }
        }
      })

      // 跳进度条就重置所有字幕
      video.addEventListener('seeked', () => {
        unListenRows()
        rowUnListenMap.clear()
      })
    })

    this.videoUnListen = () => {
      mainUnListen()
      unListenRows()
    }
  }

  async useSubtitle(subtitleItemsLabel: string) {
    this.reset()
    let subTitleData = this.subtitleCache[subtitleItemsLabel]
    if (!subTitleData) {
      const subtitleRows = await this.loadSubtitle(subtitleItemsLabel)
      subTitleData = { rows: subtitleRows }
    }
    this.listenVideoEvents()
  }

  abstract loadSubtitle(value: string): Promise<SubtitleRow[]>
  reset() {
    this.videoUnListen()
    this.subtitleCache = {}
    this.video = null
    this.rows = []
    this.rowIndex = 0
    this.activeRows = {}
  }
}

export default SubtitleManager
