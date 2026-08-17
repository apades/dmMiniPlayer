import { PathBar } from './path'

const HOVER_COLOR = '59, 130, 246'
const PICKED_COLOR = '249, 115, 22'
const MATCHED_COLOR = '34, 197, 94'

function applyBoxStyle(
  box: HTMLDivElement,
  color: string,
  zIndex: string,
): void {
  Object.assign(box.style, {
    position: 'fixed',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    border: `2px solid rgb(${color})`,
    background: `rgba(${color}, 0.14)`,
    borderRadius: '2px',
    zIndex,
    margin: '0',
    padding: '0',
  })
}

function syncBox(box: HTMLDivElement, target: HTMLElement): void {
  const rect = target.getBoundingClientRect()
  Object.assign(box.style, {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 0)}px`,
    height: `${Math.max(rect.height, 0)}px`,
    display: rect.width || rect.height ? 'block' : 'none',
  })
}

export class HighlightOverlay {
  readonly root: HTMLDivElement
  private hoverTargets: HTMLElement[] = []
  private hoverBoxes: HTMLDivElement[] = []
  private hoverPath: PathBar
  private selected = new Map<
    HTMLElement,
    { box: HTMLDivElement; kind: 'picked' | 'matched' }
  >()
  private selectedPaths = new Map<HTMLElement, PathBar>()
  private focusedPath: PathBar | null = null
  private raf = 0
  private layoutBound = false

  private onLayout = () => {
    this.scheduleRefresh()
  }

  constructor(private doc: Document = document) {
    this.root = doc.createElement('div')
    this.root.dataset.elementPicker = 'overlay'
    Object.assign(this.root.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '2147483647',
    })
    this.hoverPath = new PathBar(this.doc)
    this.bindPathBar(this.hoverPath)
    this.root.appendChild(this.hoverPath.host)
  }

  get mounted(): boolean {
    return this.root.isConnected
  }

  mount(parent: Element = this.doc.documentElement): void {
    if (!this.mounted) parent.appendChild(this.root)
    if (this.layoutBound) return
    this.layoutBound = true
    this.doc.addEventListener('scroll', this.onLayout, true)
    this.doc.defaultView?.addEventListener('resize', this.onLayout)
  }

  unmount(): void {
    this.clear()
    if (this.layoutBound) {
      this.doc.removeEventListener('scroll', this.onLayout, true)
      this.doc.defaultView?.removeEventListener('resize', this.onLayout)
      this.layoutBound = false
    }
    this.root.remove()
  }

  setHover(elements: HTMLElement | HTMLElement[] | null): void {
    this.hoverTargets = !elements
      ? []
      : Array.isArray(elements)
        ? elements
        : [elements]
    this.syncHoverBoxes()
  }

  setHoverPath(anchor: HTMLElement | null): void {
    if (anchor && this.selectedPaths.has(anchor)) {
      this.hoverPath.setAnchor(null)
      return
    }
    this.hoverPath.setAnchor(anchor)
    this.scheduleRefresh()
  }

  pathElementFromEvent(event: Event): HTMLElement | null {
    return (
      this.hoverPath.elementFromEvent(event) ??
      [...this.selectedPaths.values()]
        .map((bar) => bar.elementFromEvent(event))
        .find((el): el is HTMLElement => !!el) ??
      null
    )
  }

  isPathEvent(event: Event): boolean {
    return (
      this.hoverPath.containsEvent(event) ||
      [...this.selectedPaths.values()].some((bar) => bar.containsEvent(event))
    )
  }

  private pathBars(): PathBar[] {
    return [this.hoverPath, ...this.selectedPaths.values()]
  }

  private bindPathBar(bar: PathBar): void {
    bar.host.addEventListener('mouseenter', () => this.focusPathBar(bar))
    bar.host.addEventListener('mouseleave', () => this.focusPathBar(null))
  }

  private focusPathBar(active: PathBar | null): void {
    this.focusedPath = active
    for (const bar of this.pathBars()) {
      bar.setSuppressed(active != null && bar !== active)
    }
  }

  setPathActive(el: HTMLElement | null): void {
    this.hoverPath.setActive(el)
    for (const bar of this.selectedPaths.values()) bar.setActive(el)
  }

  setSelected(elements: HTMLElement[], picked: HTMLElement[] = elements): void {
    const next = new Set(elements)
    const pickedSet = new Set(picked)
    for (const [el, item] of this.selected) {
      if (next.has(el)) continue
      item.box.remove()
      this.selected.delete(el)
    }
    for (const el of elements) {
      const kind = pickedSet.has(el) ? 'picked' : 'matched'
      const color = kind === 'picked' ? PICKED_COLOR : MATCHED_COLOR
      let item = this.selected.get(el)
      if (!item) {
        const box = this.doc.createElement('div')
        applyBoxStyle(box, color, '0')
        this.root.appendChild(box)
        item = { box, kind }
        this.selected.set(el, item)
      } else if (item.kind !== kind) {
        applyBoxStyle(item.box, color, '0')
        item.kind = kind
      }
      item.box.dataset.elementPicker = kind
      syncBox(item.box, el)
    }
    this.syncSelectedPaths(picked.filter((el) => next.has(el)))
    this.scheduleRefresh()
  }

  refresh(): void {
    this.syncHoverBoxes()
    this.hoverPath.sync()
    for (const bar of this.selectedPaths.values()) bar.sync()
    for (const [el, item] of this.selected) {
      if (!el.isConnected) {
        item.box.remove()
        this.selected.delete(el)
        continue
      }
      syncBox(item.box, el)
    }
  }

  scheduleRefresh(): void {
    if (this.raf) return
    this.raf = requestAnimationFrame(() => {
      this.raf = 0
      this.refresh()
    })
  }

  private syncHoverBoxes(): void {
    const connected = this.hoverTargets.filter((el) => el.isConnected)
    this.hoverTargets = connected
    while (this.hoverBoxes.length > connected.length) {
      this.hoverBoxes.pop()?.remove()
    }
    while (this.hoverBoxes.length < connected.length) {
      const box = this.doc.createElement('div')
      box.dataset.elementPicker = 'hover'
      applyBoxStyle(box, HOVER_COLOR, '1')
      this.root.appendChild(box)
      this.hoverBoxes.push(box)
    }
    connected.forEach((el, index) => {
      syncBox(this.hoverBoxes[index], el)
    })
  }

  private syncSelectedPaths(picked: HTMLElement[]): void {
    const next = new Set(picked)
    for (const [el, bar] of this.selectedPaths) {
      if (next.has(el)) continue
      bar.remove()
      this.selectedPaths.delete(el)
    }
    for (const el of picked) {
      let bar = this.selectedPaths.get(el)
      if (!bar) {
        bar = new PathBar(this.doc)
        this.bindPathBar(bar)
        this.root.appendChild(bar.host)
        this.selectedPaths.set(el, bar)
      }
      bar.setAnchor(el)
    }
    if (this.hoverPath) this.hoverPath.setAnchor(null)
    if (this.focusedPath && !this.pathBars().includes(this.focusedPath)) {
      this.focusPathBar(null)
    }
  }

  clear(): void {
    this.setHover(null)
    this.setHoverPath(null)
    this.setSelected([])
    if (this.raf) {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    }
  }
}
