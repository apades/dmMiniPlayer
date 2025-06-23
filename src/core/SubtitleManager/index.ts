import { addEventListener, readTextFromFile, tryCatch } from '@root/utils'
import Events2 from '@root/utils/Events2'
import { autorun, makeObservable, observable, runInAction } from 'mobx'
import { ERROR_MSG } from '@root/shared/errorMsg'
import toast from 'react-hot-toast'
import { getNowLang, t } from '@root/utils/i18n'
import { googleTranslate } from '@root/utils/translate'
import { PlayerComponent } from '../types'
import assParser from './subtitleParser/ass'
import srtParser from './subtitleParser/srt'
import type { SubtitleItem, SubtitleManagerEvents, SubtitleRow } from './types'

export const translateMode = {
  double: t('subtitleTranslate.double'),
  single: t('subtitleTranslate.single'),
  none: t('subtitleTranslate.none'),
} as const
class SubtitleManager extends Events2<SubtitleManagerEvents> {
  initd = false
  subtitleItems: SubtitleItem[] = []

  video?: HTMLVideoElement
  private subtitleCache = new Map<string, { rows: SubtitleRow[] }>()
  /**正在使用的字幕rows */
  rows: SubtitleRow[] = []
  rowIndex = 0
  activeRows = new Set<SubtitleRow>()
  activeSubtitleLabel: string = ''
  showSubtitle = false
  translateMode: keyof typeof translateMode = 'none'

  nowSubtitleItemsLabel: string = ''

  protected onUnloadFn: (() => void)[] = []
  protected addOnUnloadFn(fn: () => void) {
    this.onUnloadFn.push(fn)
  }

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
      showSubtitle: true,
      translateMode: true,
      nowSubtitleItemsLabel: true,
    })

    this.addOnUnloadFn(
      autorun(() => {
        this.autoloadSubtitle()
      }),
    )
  }

  async init(video: HTMLVideoElement) {
    this.reset()
    this.video = video

    const [err] = await tryCatch(async () => this.onInit())
    if (err) {
      toast.error(t('error.subtitleLoad'))
    }
    this.initd = true
  }
  onInit() {}
  unload() {
    this.reset()
    this.onUnload()
    this.onUnloadFn.forEach((fn) => fn())
  }
  onUnload() {}

  // addSubtitle(label: string, rows: SubtitleRow[]) {
  //   this.subtitleItems.push({ label, value: label })
  //   this.subtitleCache.set(label, { rows })
  // }

  async addFileSubtitle(file: File) {
    const label = file.name
    if (this.subtitleCache.has(label)) {
      throw Error('Already add this file')
    }
    const fileType = (label.split('.').pop() ?? '').toLowerCase()
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
    if (!video) throw Error(ERROR_MSG.unInitVideoEl)
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

  updateVideo(video: HTMLVideoElement) {
    this.videoUnListen()
    this.video = video
    this.listenVideoEvents(video)
  }

  async useSubtitle(subtitleItemsLabel: string) {
    runInAction(() => {
      this.nowSubtitleItemsLabel = subtitleItemsLabel
    })
  }

  private async autoloadSubtitle() {
    const subtitleItemsLabel = this.nowSubtitleItemsLabel
    const translateMode = this.translateMode
    if (!subtitleItemsLabel) return
    this.resetSubtitleState()
    this.activeSubtitleLabel = subtitleItemsLabel
    // let subtitleData = this.subtitleCache.get(
    //   `${subtitleItemsLabel}-${translateMode}`,
    // )
    let subtitleData = null as { rows: SubtitleRow[] } | null
    const subtitleItemsValue = this.subtitleItems.find(
      (item) => item.label === subtitleItemsLabel,
    )?.value

    await (async () => {
      if (!subtitleData && subtitleItemsValue) {
        const [err, subtitleRows] = await tryCatch(() =>
          this.loadSubtitle(subtitleItemsValue),
        )

        if (err || !subtitleRows.length) {
          toast.error(t('error.subtitleLoad'))
          return
        }

        if (this.translateMode !== 'none') {
          const [err, translatedTexts] = await tryCatch(() =>
            googleTranslate(
              subtitleRows.map((row) => row.text),
              getNowLang(),
            ),
          )
          if (!err) {
            switch (this.translateMode) {
              case 'single':
                subtitleData = {
                  rows: subtitleRows.map((d, i) => {
                    return {
                      ...d,
                      text: translatedTexts[i],
                      htmlText: translatedTexts[i],
                    }
                  }),
                }
                return
              case 'double':
                subtitleData = {
                  rows: subtitleRows.map((d, i) => {
                    return {
                      ...d,
                      text: `${d.text}\n${translatedTexts[i]}`,
                      htmlText: `${d.text}\n${translatedTexts[i]}`,
                    }
                  }),
                }
                return
            }
          } else {
            toast.error(t('error.translateFail'))
          }
        }

        subtitleData = { rows: subtitleRows }
      }
    })()

    if (subtitleData) {
      this.rows = [...subtitleData.rows]

      this.subtitleCache.set(
        `${subtitleItemsLabel}-${translateMode}`,
        subtitleData,
      )
    }

    this.listenVideoEvents()
    this.showSubtitle = true
  }

  async loadSubtitle(value: string): Promise<SubtitleRow[]> {
    return []
  }

  reset() {
    this.subtitleItems.length = 0
    this.subtitleCache.clear()
    this.resetSubtitleState()
    this.emit('reset')
  }

  resetSubtitleState() {
    // this.unListenRows()
    this.videoUnListen()
    this.rows.length = 0
    this.rowIndex = 0
    this.activeRows.clear()
    this.activeSubtitleLabel = ''
    this.showSubtitle = false
  }
}

export class CommonSubtitleManager extends SubtitleManager {
  constructor() {
    super()
  }
  async loadSubtitle(value: string): Promise<SubtitleRow[]> {
    return []
  }
}

export default SubtitleManager
