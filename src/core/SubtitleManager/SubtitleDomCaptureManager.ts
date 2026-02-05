import { OrPromise } from '@root/utils/typeUtils'
import { dq, dq1, wait } from '@root/utils'
import { logBox } from '@root/utils/logbox'
import { ERROR_MSG } from '@root/shared/errorMsg'
import { SubtitleItem, SubtitleRow } from './types'
import SubtitleManager from '.'

type SubtitleDomConfig = {
  type: 'subtitleDom'
  targetEls: {
    // type: 'sp' | 'top' | 'bottom'
    el?: string
    container: string
  }[]
}
type DataNode =
  | {
      type: 'event'
      event: Event
      targetEl: string
      wait?: number
    }
  | {
      type: 'subtitleElList'
      container: string
      child?: string
      text?: string
      isActive: string
      filter?: (list: SubtitleItem[]) => SubtitleItem[]
    }
  | SubtitleDomConfig
export default abstract class SubtitleDomCaptureManager extends SubtitleManager {
  abstract getConfig(): OrPromise<DataNode[]>

  private _subtitleDomConfig!: SubtitleDomConfig
  get subtitleDomConfig() {
    return this._subtitleDomConfig
  }

  #labelToClickChildElMap = new Map<string, HTMLElement>()
  override async init(video: HTMLVideoElement) {
    super.init(video)
    const config = await this.getConfig()

    const console = logBox('SubtitleDomCaptureManager')

    let notHasSubtitleDomConfig = true
    for (const node of config) {
      switch (node.type) {
        case 'event':
          const tar = dq1(node.targetEl)
          if (!tar) {
            console.log(`targetEl: ${node.targetEl} not found`)
            continue
          }
          console.log('tar', tar)
          tar.dispatchEvent(node.event)
          await wait(node.wait ?? 50)
          break
        case 'subtitleElList':
          const container = dq1(node.container)
          if (!container) {
            console.log(`container: ${node.container} not found`)
            continue
          }
          const childs = node.child
            ? dq(node.child, container)
            : Array.from(container.children)

          const filter = node.filter ?? ((list) => list)
          let unknownIndex = 0
          this.subtitleItems = filter(
            childs.map((el) => {
              const textEl = node.text ? (dq1(node.text, el) ?? el) : el
              const text = textEl.textContent ?? `unknown-${unknownIndex++}`
              this.#labelToClickChildElMap.set(text, el as HTMLElement)
              return {
                label: text,
                value: text,
              }
            }),
          )
          break
        case 'subtitleDom':
          this._subtitleDomConfig = node
          notHasSubtitleDomConfig = false
          break
      }
    }
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    if (notHasSubtitleDomConfig) {
      throw Error(ERROR_MSG.subtitleDomConfigNotFound)
    }

    this.startObserveSubtitleDom()
  }

  protected override listenVideoEvents(): void {}

  #hasObserveSubtitleDom = false
  private startObserveSubtitleDom() {
    if (this.#hasObserveSubtitleDom) return
    this.#hasObserveSubtitleDom = true
    const config = this.subtitleDomConfig
    for (const node of config.targetEls) {
      const container = dq1(node.container)
      // const container = node.container ? dq1(node.container) : el?.parentElement
      console.log('container', container)
      if (!container) throw Error('subtitle dom container not found')
      let preRow: SubtitleRow | undefined
      const observer = new MutationObserver((list) => {
        const tar = list[0].target as HTMLElement
        const el = node.el ? (dq1(node.el, container) ?? container) : container
        // console.log('update', el, el.textContent)
        preRow && this.emit('row-leave', preRow)

        const text = (el.textContent ?? '').trim()
        if (!text) return

        const nowRow: SubtitleRow = {
          startTime: this.video?.currentTime ?? 0,
          endTime: 999999,
          id: new Date().getTime() + '',
          text,
          htmlText: text,
        }
        preRow = nowRow
        this.emit('row-enter', nowRow)
      })
      observer.observe(container, { childList: true, subtree: true })

      this.addOnUnloadFn(() => observer.disconnect())
    }
  }

  override async autoloadSubtitle() {
    const subtitleItemsLabel = this.nowSubtitleItemsLabel
    if (!subtitleItemsLabel) return
    this.resetSubtitleState()
    this.activeSubtitleLabel = subtitleItemsLabel

    const el = this.#labelToClickChildElMap.get(subtitleItemsLabel)
    if (el) {
      el.click()
    }

    this.listenVideoEvents()
    this.showSubtitle = true
  }
}
