import {
  makeAutoObservable,
  makeObservable,
  observable,
  ObservableMap,
  ObservableSet,
  computed,
} from 'mobx'
import type { SubtitleItem, SubtitleManagerEvents, SubtitleRow } from './types'
import Events2 from '@root/utils/Events2'
import { addEventListener, readTextFromFile } from '@root/utils'
import srtParser from './subtitleParser/srt'
import vpConfig from '@root/store/vpConfig'
import assParser from './subtitleParser/ass'

abstract class SubtitleManager extends Events2<SubtitleManagerEvents> {
  subtitleItems: SubtitleItem[] = []

  video: HTMLVideoElement
  private subtitleCache = new Map<string, { rows: SubtitleRow[] }>()
  /**正在使用的字幕rows */
  rows: SubtitleRow[] = []
  rowIndex = 0
  activeRows = new Set<SubtitleRow>()
  activeSubtitleLabel: string = null

  /**停止监听所有video事件 */
  private videoUnListen = () => {}
  constructor() {
    super()
    // makover(this, { video: false, activeRows: false })
    makeObservable(this, {
      subtitleItems: observable,
      rowIndex: observable,
      // activeRows: observable,
      activeSubtitleLabel: observable,
    })
  }

  init(video: HTMLVideoElement) {
    this.reset()
    this.video = video
  }

  addSubtitle(label: string, rows: SubtitleRow[]) {
    this.subtitleItems.push({ label, value: label })
    this.subtitleCache.set(label, { rows })
  }

  async addFileSubtitle(file: File) {
    const label = file.name
    if (this.subtitleCache.has(label)) {
      throw Error('Already add this file')
    }
    const fileType = label.split('.').pop().toLowerCase()
    let rows: SubtitleRow[] = []
    switch (fileType) {
      case 'srt': {
        const text = await readTextFromFile(file)
        rows = srtParser(text)
        break
      }
      case 'ass': {
        const text = await readTextFromFile(file)
        rows = assParser(text)
        break
      }
      default: {
        throw Error('Unsupported subtitle file. Only support .srt .ass')
      }
    }
    console.log('解析后的rows', rows)

    this.subtitleItems.push({ label, value: label })
    this.subtitleCache.set(label, { rows })
    this.useSubtitle(label)
  }

  private listenVideoEvents(video = this.video) {
    const rowUnListenMap = new Map<SubtitleRow, () => void>()
    const unListenRows = () => {
      ;[...rowUnListenMap.entries()].forEach(([row, unListen]) => {
        this.emit('row-leave', row)
        this.activeRows.delete(row)
        unListen()
      })
    }
    const mainUnListen = addEventListener(video, (video) => {
      const handleOnTimeUpdate = () => {
        const cTime = video.currentTime
        while (this.rowIndex < this.rows.length) {
          const row = this.rows[this.rowIndex]
          if (row.endTime <= cTime) {
            this.rowIndex++
            continue
          }
          if (row.startTime >= cTime) {
            break
          }
          this.rowIndex++
          // 触发enter
          this.emit('row-enter', row)
          this.activeRows.add(row)

          const rowUnListen = addEventListener(video, (video) => {
            video.addEventListener('timeupdate', () => {
              const cTime = video.currentTime
              if (row.endTime <= cTime) {
                // 触发leave
                this.emit('row-leave', row)
                this.activeRows.delete(row)

                // 删除监听
                rowUnListenMap.delete(row)
                rowUnListen()
              }
            })
          })
          rowUnListenMap.set(row, rowUnListen)
        }
      }
      video.addEventListener('timeupdate', () => {
        handleOnTimeUpdate()
      })

      // 跳进度条就重置所有字幕
      video.addEventListener('seeked', () => {
        unListenRows()
        rowUnListenMap.clear()
        this.rowIndex = 0
        handleOnTimeUpdate()
      })
    })

    this.videoUnListen = () => {
      mainUnListen()
      unListenRows()
    }
  }

  async useSubtitle(subtitleItemsLabel: string) {
    this.resetSubtitleState()
    this.activeSubtitleLabel = subtitleItemsLabel
    let subtitleData = this.subtitleCache.get(subtitleItemsLabel)
    const subtitleItemsValue = this.subtitleItems.find(
      (item) => item.label === subtitleItemsLabel
    ).value

    if (!subtitleData) {
      const subtitleRows = await this.loadSubtitle(subtitleItemsValue)
      subtitleData = { rows: subtitleRows }
    }
    this.rows = [...subtitleData.rows]
    this.listenVideoEvents()
    vpConfig.showSubtitle = true
  }

  abstract loadSubtitle(value: string): Promise<SubtitleRow[]>

  reset() {
    this.subtitleItems.length = 0
    this.subtitleCache.clear()
    this.resetSubtitleState()
  }

  resetSubtitleState() {
    // this.unListenRows()
    this.videoUnListen()
    this.rows.length = 0
    this.rowIndex = 0
    this.activeRows.clear()
    this.activeSubtitleLabel = null
  }
}

export class CommonSubtitleManager extends SubtitleManager {
  constructor() {
    super()
  }
  loadSubtitle(value: string): Promise<SubtitleRow[]> {
    return
  }
}

export default SubtitleManager
