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
    text?: string
    container: string
  }[]
}
type DataNode =
  | {
      type: 'event'
      event: Event
      targetEl: string | (() => Element | undefined)
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
  #resetListenerInited = false
  override async onInit() {
    if (!this.#resetListenerInited) {
      this.#resetListenerInited = true
      this.on('reset', () => {
        this.#hasObserveSubtitleDom = false
        this.#observeSubtitleDomUnlisten()
      })
    }

    const config = await this.getConfig()

    const console = logBox('SubtitleDomCaptureManager')

    let notHasSubtitleDomConfig = true
    for (const node of config) {
      switch (node.type) {
        case 'event':
          let tar: Element | undefined
          for (let i = 0; i < 10; i++) {
            tar =
              typeof node.targetEl === 'function'
                ? node.targetEl()
                : dq1(node.targetEl)
            if (tar) break
            await wait(300)
          }
          if (!tar) {
            console.log(`targetEl: ${node.targetEl} not found`)
            continue
          }
          console.log('tar', tar)
          tar.dispatchEvent(node.event)
          await wait(node.wait ?? 50)
          break
        case 'subtitleElList':
          let container: Element | undefined
          let childs: Element[] = []
          for (let i = 0; i < 10; i++) {
            await wait(500)
            container = dq(node.container).pop()
            if (!container) continue
            childs = node.child
              ? dq(node.child, container)
              : Array.from(container.children)
            if (childs.length) break
          }
          if (!container) {
            console.log(`container: ${node.container} not found`)
            continue
          }
          if (!childs.length) {
            console.log(`container: ${node.container} children not found`)
            continue
          }

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
    if (notHasSubtitleDomConfig && config.length) {
      throw Error(ERROR_MSG.subtitleDomConfigNotFound)
    }
    if (config.length) {
      await wait(500)
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      this.startObserveSubtitleDom()
    }
  }

  protected override listenVideoEvents(): void {}

  #staleReason = ''
  #refreshTimer: ReturnType<typeof setTimeout> | undefined
  protected markSubtitleDomStale(reason: string) {
    this.#staleReason = reason
  }

  protected clearSubtitleDomStale() {
    this.#staleReason = ''
  }

  protected get subtitleDomStale() {
    return !!this.#staleReason
  }

  protected refreshSubtitleDomWhenStale(reason: string) {
    if (!this.subtitleDomStale) return
    clearTimeout(this.#refreshTimer)
    this.#refreshTimer = setTimeout(() => {
      if (!this.subtitleDomStale) return
      console.log(`refresh subtitle dom: ${this.#staleReason} -> ${reason}`)
      this.clearSubtitleDomStale()
      this.refresh({ keepActive: true, useFirstWhenMissing: true })
    }, 800)
  }

  #hasObserveSubtitleDom = false
  #observeSubtitleDomUnlisten = () => {}
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
        const el = node.el ? dq1(node.el, container) : container
        if (!el) return
        // console.log('update', el, el.textContent)
        preRow && this.emit('row-leave', preRow)

        const textEls = node.text ? dq(node.text, el) : [el]
        const text = textEls
          .map((el) => el.textContent?.trim())
          .filter(Boolean)
          .join('\n')
          .trim()
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

      // this.addOnUnloadFn(() => observer.disconnect())
      this.#observeSubtitleDomUnlisten = () => {
        observer.disconnect()
        this.#observeSubtitleDomUnlisten = () => {}
      }
    }
  }

  override async autoloadSubtitle() {
    const subtitleItemsLabel = this.nowSubtitleItemsLabel
    if (!subtitleItemsLabel) return
    if (this.subtitleDomStale) {
      this.refreshSubtitleDomWhenStale('autoload')
      return
    }
    this.resetSubtitleState()
    this.activeSubtitleLabel = subtitleItemsLabel

    const el = this.#labelToClickChildElMap.get(subtitleItemsLabel)
    if (el) {
      el.click()
    }

    this.listenVideoEvents()
    this.showSubtitle = true
  }

  override unload(): void {
    super.unload()
    clearTimeout(this.#refreshTimer)
    this.#observeSubtitleDomUnlisten()
  }
}
