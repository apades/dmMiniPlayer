const HOVER_COLOR = '59, 130, 246'
const SELECTED_COLOR = '34, 197, 94'

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
  private hoverBox: HTMLDivElement
  private hoverTarget: HTMLElement | null = null
  private selected = new Map<HTMLElement, HTMLDivElement>()
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

    this.hoverBox = doc.createElement('div')
    this.hoverBox.dataset.elementPicker = 'hover'
    applyBoxStyle(this.hoverBox, HOVER_COLOR, '1')
    this.hoverBox.style.display = 'none'
    this.root.appendChild(this.hoverBox)
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

  setHover(el: HTMLElement | null): void {
    this.hoverTarget = el
    if (!el) {
      this.hoverBox.style.display = 'none'
      return
    }
    this.hoverBox.style.display = 'block'
    syncBox(this.hoverBox, el)
  }

  setSelected(elements: HTMLElement[]): void {
    const next = new Set(elements)
    for (const [el, box] of this.selected) {
      if (next.has(el)) continue
      box.remove()
      this.selected.delete(el)
    }
    for (const el of elements) {
      let box = this.selected.get(el)
      if (!box) {
        box = this.doc.createElement('div')
        box.dataset.elementPicker = 'selected'
        applyBoxStyle(box, SELECTED_COLOR, '0')
        this.root.appendChild(box)
        this.selected.set(el, box)
      }
      syncBox(box, el)
    }
    this.scheduleRefresh()
  }

  refresh(): void {
    if (this.hoverTarget) syncBox(this.hoverBox, this.hoverTarget)
    for (const [el, box] of this.selected) {
      if (!el.isConnected) {
        box.remove()
        this.selected.delete(el)
        continue
      }
      syncBox(box, el)
    }
  }

  scheduleRefresh(): void {
    if (this.raf) return
    this.raf = requestAnimationFrame(() => {
      this.raf = 0
      this.refresh()
    })
  }

  clear(): void {
    this.setHover(null)
    this.setSelected([])
    if (this.raf) {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    }
  }
}
