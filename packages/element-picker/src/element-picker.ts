import {
  buildCssSelector,
  extractFeatures,
  inferListFeatures,
  matchesFeatures,
  matchesNotFeatures,
  queryByFeatures,
  refineFeatures,
} from './features'
import { HighlightOverlay } from './overlay'
import { PickerPanel } from './panel'
import type {
  ElementFeature,
  ElementPickerEvents,
  ElementPickerOptions,
  ElementPickerType,
  Selector,
} from './types'
import { debounce, deepElementFromPoint, uniqueElements } from './utils'

type EventHandler<T> = (payload: T) => void

function inferType(options: ElementPickerOptions): ElementPickerType {
  if (options.type) return options.type
  return Array.isArray(options.selector) ? 'list' : 'single'
}

function resolveSelectorItem(
  selector: Selector,
  mode: ElementPickerType,
  doc: Document,
): HTMLElement[] {
  if (selector instanceof HTMLElement) return [selector]
  try {
    if (mode === 'single') {
      const el = doc.querySelector(selector)
      return el instanceof HTMLElement ? [el] : []
    }
    return [...doc.querySelectorAll(selector)].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    )
  } catch {
    return []
  }
}

export class ElementPicker {
  readonly type: ElementPickerType

  private doc: Document
  private overlay: HighlightOverlay
  private panel: PickerPanel
  private picking = false
  private observer: MutationObserver | null = null
  private providedSelector = ''
  private scope: ParentNode
  private positives: HTMLElement[] = []
  private negatives: HTMLElement[] = []
  private currentElements: HTMLElement[] = []
  private currentFeatures: ElementFeature[] = []
  private notFeatures: ElementFeature[] = []
  private hoverEl: HTMLElement | null = null
  private savedCursor = ''
  private listeners = new Map<
    keyof ElementPickerEvents,
    Set<EventHandler<any>>
  >()

  private onMouseMove = (event: MouseEvent) => {
    const el = deepElementFromPoint(this.doc, event.clientX, event.clientY)
    if (el === this.hoverEl) return
    this.hoverEl = el
    this.overlay.setHover(el)
    this.emit('hover', el)
  }

  private onClick = (event: MouseEvent) => {
    if (event.button !== 0 || this.isPickerEvent(event)) return
    const el = deepElementFromPoint(this.doc, event.clientX, event.clientY)
    if (!el) return
    event.preventDefault()
    event.stopPropagation()
    this.pick(el)
  }

  private onContextMenu = (event: MouseEvent) => {
    if (this.type !== 'list' || this.isPickerEvent(event)) return
    const el = deepElementFromPoint(this.doc, event.clientX, event.clientY)
    if (!el) return
    event.preventDefault()
    event.stopPropagation()
    this.exclude(el)
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    this.close()
  }

  private onDomChange = debounce(() => {
    this.resync()
  }, 80)

  constructor(public options: ElementPickerOptions) {
    this.type = inferType(options)
    this.doc = document
    this.scope = document
    this.overlay = new HighlightOverlay(this.doc)
    this.panel = this.createPanel()

    if (options.selector != null) {
      this.applySelector(options.selector)
      this.ensureUi()
      this.overlay.setSelected(this.currentElements)
      this.syncPanel()
      if (this.shouldObserve()) this.watchDom()
    }
  }

  get elements(): HTMLElement[] {
    return this.currentElements.slice()
  }

  get features(): ElementFeature[] {
    return this.currentFeatures.slice()
  }

  get cssSelector(): string {
    if (this.providedSelector) return this.providedSelector
    return buildCssSelector(this.currentFeatures, this.notFeatures, this.scope)
  }

  start(): this {
    if (this.picking) return this
    this.picking = true
    this.ensureUi()
    this.overlay.setSelected(this.currentElements)
    this.syncPanel()

    this.savedCursor = this.doc.documentElement.style.cursor
    this.doc.documentElement.style.cursor = 'crosshair'

    this.doc.addEventListener('mousemove', this.onMouseMove, true)
    this.doc.addEventListener('click', this.onClick, true)
    this.doc.addEventListener('contextmenu', this.onContextMenu, true)
    this.doc.addEventListener('keydown', this.onKeyDown, true)

    if (this.shouldObserve()) this.watchDom()
    return this
  }

  stop(): this {
    if (!this.picking) return this
    this.picking = false
    this.hoverEl = null
    this.overlay.setHover(null)
    this.doc.documentElement.style.cursor = this.savedCursor

    this.doc.removeEventListener('mousemove', this.onMouseMove, true)
    this.doc.removeEventListener('click', this.onClick, true)
    this.doc.removeEventListener('contextmenu', this.onContextMenu, true)
    this.doc.removeEventListener('keydown', this.onKeyDown, true)

    this.emit('stop', undefined)
    return this
  }

  confirm(): this {
    this.emit('confirm', {
      elements: this.elements,
      cssSelector: this.cssSelector,
    })
    this.stop()
    this.unwatchDom()
    this.overlay.unmount()
    this.panel.unmount()
    return this
  }

  close(): this {
    this.emit('close', undefined)
    this.destroy()
    return this
  }

  destroy(): void {
    this.stop()
    this.unwatchDom()
    this.overlay.unmount()
    this.panel.unmount()
    this.positives = []
    this.negatives = []
    this.currentElements = []
    this.currentFeatures = []
    this.notFeatures = []
    this.listeners.clear()
  }

  on<K extends keyof ElementPickerEvents>(
    event: K,
    handler: EventHandler<ElementPickerEvents[K]>,
  ): this {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(handler)
    return this
  }

  off<K extends keyof ElementPickerEvents>(
    event: K,
    handler?: EventHandler<ElementPickerEvents[K]>,
  ): this {
    if (!handler) {
      this.listeners.delete(event)
      return this
    }
    this.listeners.get(event)?.delete(handler)
    return this
  }

  private emit<K extends keyof ElementPickerEvents>(
    event: K,
    payload: ElementPickerEvents[K],
  ): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const handler of set) handler(payload)
  }

  private applySelector(selector: Selector | Selector[]): void {
    const items = Array.isArray(selector) ? selector : [selector]
    if (typeof selector === 'string') {
      this.providedSelector = selector
    } else if (
      Array.isArray(selector) &&
      selector.length &&
      selector.every((item) => typeof item === 'string')
    ) {
      this.providedSelector = selector.join(', ')
    }

    const firstEl = items.find(
      (item): item is HTMLElement => item instanceof HTMLElement,
    )
    this.bindDocument(firstEl?.ownerDocument ?? document)
    this.scope = this.doc

    const resolved: HTMLElement[] = []
    for (const item of items) {
      resolved.push(...resolveSelectorItem(item, this.type, this.doc))
    }
    this.currentElements = uniqueElements(resolved)
    this.positives = this.currentElements.slice()

    if (this.currentElements.length) {
      this.currentFeatures =
        this.type === 'list'
          ? refineFeatures(this.currentElements, []).features
          : extractFeatures(this.currentElements[0])
    }
  }

  private pick(el: HTMLElement): void {
    if (this.type === 'single') {
      this.providedSelector = ''
      this.positives = [el]
      this.negatives = []
      this.currentFeatures = extractFeatures(el)
      this.notFeatures = []
      this.scope = this.doc
      this.setElements([el], true)
      return
    }

    this.providedSelector = ''
    this.negatives = this.negatives.filter((item) => item !== el)

    if (!this.positives.length) {
      this.positives = [el]
      const inferred = inferListFeatures(el)
      this.currentFeatures = inferred.features
      this.notFeatures = []
      this.scope = inferred.scope
    } else if (!this.positives.includes(el)) {
      this.positives.push(el)
      const refined = refineFeatures(this.positives, this.negatives)
      this.currentFeatures = refined.features
      this.notFeatures = refined.notFeatures
    }

    this.resync(true)
  }

  private exclude(el: HTMLElement): void {
    if (!this.currentElements.includes(el)) return

    this.providedSelector = ''
    this.positives = this.positives.filter((item) => item !== el)
    if (!this.negatives.includes(el)) this.negatives.push(el)

    if (!this.positives.length) {
      const leftover = this.currentElements.filter((item) => item !== el)
      this.positives = leftover.slice(0, 1)
    }

    const refined = refineFeatures(this.positives, this.negatives)
    this.currentFeatures = refined.features
    this.notFeatures = refined.notFeatures
    this.emit('exclude', el)
    this.resync(true)
  }

  private resync(fromUser = false): void {
    const matched = this.collectMatches()
    this.setElements(matched, fromUser)
  }

  private collectMatches(): HTMLElement[] {
    if (this.type === 'single') {
      return this.positives.filter((el) => el.isConnected)
    }

    if (this.providedSelector) {
      return resolveSelectorItem(this.providedSelector, 'list', this.doc)
    }

    if (!this.currentFeatures.length) {
      return this.positives.filter((el) => el.isConnected)
    }

    const scope =
      this.scope instanceof Node && this.scope.isConnected
        ? this.scope
        : this.doc
    const queried = queryByFeatures(this.currentFeatures, scope).filter(
      (el) =>
        !this.negatives.includes(el) &&
        !matchesNotFeatures(el, this.notFeatures) &&
        matchesFeatures(el, this.currentFeatures),
    )

    return uniqueElements([
      ...this.positives.filter(
        (el) => el.isConnected && !this.negatives.includes(el),
      ),
      ...queried,
    ])
  }

  private setElements(elements: HTMLElement[], fromUser: boolean): void {
    const prev = this.currentElements
    this.currentElements = elements
    this.overlay.setSelected(elements)
    this.syncPanel()

    const changed =
      prev.length !== elements.length ||
      prev.some((el, index) => el !== elements[index])
    if (!changed) return

    if (fromUser) this.emit('select', this.elements)
    this.emit('change', this.elements)
  }

  private shouldObserve(): boolean {
    return !!this.options.observerAllDomChange && this.type === 'list'
  }

  private watchDom(): void {
    if (this.observer) return
    const target = this.doc.body ?? this.doc.documentElement
    this.observer = new MutationObserver(this.onDomChange)
    this.observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }

  private unwatchDom(): void {
    this.onDomChange.cancel()
    this.observer?.disconnect()
    this.observer = null
  }

  private bindDocument(doc: Document): void {
    if (this.doc === doc && this.overlay) return
    const selected = this.currentElements
    this.overlay?.unmount()
    this.panel?.unmount()
    this.doc = doc
    this.overlay = new HighlightOverlay(doc)
    this.panel = this.createPanel()
    if (selected.length) {
      this.ensureUi()
      this.overlay.setSelected(selected)
      this.syncPanel()
    }
  }

  private createPanel(): PickerPanel {
    return new PickerPanel(this.doc, {
      onConfirm: () => this.confirm(),
      onClose: () => this.close(),
    })
  }

  private ensureUi(): void {
    this.overlay.mount(this.doc.documentElement)
    this.panel.mount(this.doc.documentElement)
  }

  private syncPanel(): void {
    this.panel.update({
      type: this.type,
      cssSelector: this.cssSelector,
      count: this.currentElements.length,
    })
  }

  private isPickerEvent(event: Event): boolean {
    return event
      .composedPath()
      .some(
        (node) =>
          node instanceof HTMLElement && node.dataset.elementPicker != null,
      )
  }
}

export type { ElementPickerOptions, Selector }
