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
  private videoUnListen = () => { }
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

  protected initing = false
  async init(video: HTMLVideoElement) {
    if (this.initing) return
    // console.trace('init subtitleManager')
    this.reset()
    this.video = video

    this.initing = true
    const [err] = await tryCatch(async () => this.onInit())
    this.initing = false
    if (err) {
      toast.error(t('error.subtitleLoad'))
    }
    this.initd = true
  }
  onInit() { }
  unload() {
    this.reset()
    this.onUnload()
    this.onUnloadFn.forEach((fn) => fn())
    this.offAll()
  }
  onUnload() { }

  // addSubtitle(label: string, rows: SubtitleRow[]) {
  //   this.subtitleItems.push({ label, value: label })
  //   this.subtitleCache.set(label, { rows })
  // }

  async addFileSubtitle(file: File) {
    const label = file.name
    const cacheKey = `custom-${label}`

    // 如果已緩存，直接重新掛載
    if (this.subtitleCache.has(cacheKey)) {
      if (!this.subtitleItems.find((item) => item.label === label)) {
        this.subtitleItems.push({ label, value: label })
      }
      this.useSubtitle(label)
      return
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
        toast.error('Unsupported subtitle file. Only support .srt .ass')
        return
      }
    }
    console.log('解析后的rows', rows)

    this.subtitleItems.push({ label, value: label })
    this.subtitleCache.set(cacheKey, { rows })
    this.useSubtitle(label)
  }

  protected listenVideoEvents(video = this.video) {
    if (!video) throw Error(ERROR_MSG.unInitVideoEl)

    // 先清理旧监听，防重复绑定
    this.videoUnListen()

    const activeRowEndTimes = new Map<SubtitleRow, number>()

    const handleTimeUpdate = () => {
      const cTime = video.currentTime

      // 檢查已激活的行是否需要離開
      for (const [row, _endTime] of activeRowEndTimes) {
        if (row.endTime <= cTime) {
          this.emit('row-leave', row)
          this.activeRows.delete(row)
          activeRowEndTimes.delete(row)
        }
      }

      // 掃描新的行進入
      while (this.rowIndex < this.rows.length) {
        const row = this.rows[this.rowIndex]
        if (row.endTime <= cTime) {
          this.rowIndex++
          continue
        }
        if (row.startTime > cTime) {
          break
        }
        this.rowIndex++
        // 觸發enter
        this.emit('row-enter', row)
        this.activeRows.add(row)
        activeRowEndTimes.set(row, row.endTime)
      }
    }

    const clearActiveRows = () => {
      for (const [row] of activeRowEndTimes) {
        this.emit('row-leave', row)
        this.activeRows.delete(row)
      }
      activeRowEndTimes.clear()
    }

    const mainUnListen = addEventListener(video, (video) => {
      video.addEventListener('timeupdate', handleTimeUpdate)

      // 跳進度條就重置所有字幕
      video.addEventListener('seeked', () => {
        clearActiveRows()
        this.rowIndex = 0
        handleTimeUpdate()
      })
    })

    this.videoUnListen = () => {
      mainUnListen()
      clearActiveRows()
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

  protected async autoloadSubtitle() {
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
        const [err, subtitleRows] = await tryCatch(() => {
          const cache = this.subtitleCache.get(`custom-${subtitleItemsValue}`)
          if (cache) return cache.rows
          return this.loadSubtitle(subtitleItemsValue)
        })

        if (err || !subtitleRows || !subtitleRows.length) {
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
  override async loadSubtitle(value: string): Promise<SubtitleRow[]> {
    return []
  }
}

export default SubtitleManager
