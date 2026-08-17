import { isNoisyClass } from './utils'

const SCROLL_STEP = 140
const PATH_MAX_WIDTH = 420

const SCROLLBAR_CSS = `
  [data-element-picker='path-scroll-view'] {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  [data-element-picker='path-scroll-view']::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
`

export function nodeLabel(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const classes = [...el.classList]
    .filter((name) => !isNoisyClass(name))
    .map((name) => `.${name}`)
    .join('')
  return `${tag}${id}${classes}`
}

export function ancestorChain(el: HTMLElement): HTMLElement[] {
  const chain: HTMLElement[] = []
  let current: HTMLElement | null = el
  while (current && current.tagName !== 'HTML') {
    chain.unshift(current)
    current = current.parentElement
  }
  return chain
}

const CHIP_STYLE: Partial<CSSStyleDeclaration> = {
  flex: '0 0 auto',
  maxWidth: '160px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: '2px 6px',
  border: '1px solid #2a3542',
  borderRadius: '4px',
  background: '#10161d',
  color: '#e7eef6',
  font: '11px/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  cursor: 'pointer',
}

function createScrollButton(doc: Document, direction: 'prev' | 'next') {
  const button = doc.createElement('button')
  button.type = 'button'
  button.dataset.elementPicker = 'path-scroll'
  button.dataset.direction = direction
  Object.assign(button.style, {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '22px',
    padding: '0',
    border: '0',
    borderRadius: '4px',
    background: 'transparent',
    color: '#93a1b1',
    cursor: 'pointer',
  })
  button.innerHTML =
    direction === 'prev'
      ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>'
  return button
}

export class PathBar {
  readonly host: HTMLDivElement
  private scroller: HTMLDivElement
  private prevBtn: HTMLButtonElement
  private nextBtn: HTMLButtonElement
  private chipToNode = new WeakMap<HTMLElement, HTMLElement>()
  private anchor: HTMLElement | null = null
  private suppressed = false

  constructor(private doc: Document) {
    this.host = doc.createElement('div')
    this.host.dataset.elementPicker = 'path'
    Object.assign(this.host.style, {
      position: 'fixed',
      display: 'none',
      alignItems: 'center',
      gap: '4px',
      maxWidth: `${PATH_MAX_WIDTH}px`,
      padding: '4px 6px',
      border: '1px solid #2a3542',
      borderRadius: '8px',
      background: '#171e27',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
      pointerEvents: 'auto',
      zIndex: '3',
    })

    const style = doc.createElement('style')
    style.textContent = SCROLLBAR_CSS
    this.host.appendChild(style)

    this.prevBtn = createScrollButton(doc, 'prev')
    this.nextBtn = createScrollButton(doc, 'next')

    this.scroller = doc.createElement('div')
    this.scroller.dataset.elementPicker = 'path-scroll-view'
    Object.assign(this.scroller.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      minWidth: '0',
      flex: '1 1 auto',
      overflowX: 'auto',
      overflowY: 'hidden',
    })

    this.prevBtn.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.scroller.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' })
    })
    this.nextBtn.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.scroller.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' })
    })
    this.scroller.addEventListener('scroll', () => this.updateScrollButtons())

    this.host.append(this.prevBtn, this.scroller, this.nextBtn)
  }

  setAnchor(el: HTMLElement | null): void {
    if (this.anchor === el) {
      this.sync()
      return
    }
    this.anchor = el
    this.render()
    this.sync()
    this.scrollToEnd()
  }

  containsEvent(event: Event): boolean {
    return event
      .composedPath()
      .some(
        (node) =>
          node instanceof Node &&
          (node === this.host || this.host.contains(node)),
      )
  }

  elementFromEvent(event: Event): HTMLElement | null {
    const chip = this.chipFromEvent(event)
    return chip ? (this.chipToNode.get(chip) ?? null) : null
  }

  setSuppressed(suppressed: boolean): void {
    if (this.suppressed === suppressed) return
    this.suppressed = suppressed
    this.sync()
  }

  setActive(el: HTMLElement | null): void {
    for (const chip of this.scroller.children) {
      if (!(chip instanceof HTMLElement)) continue
      const active = this.chipToNode.get(chip) === el
      chip.dataset.active = active ? 'true' : 'false'
      chip.style.borderColor = active ? 'rgb(59, 130, 246)' : '#2a3542'
      chip.style.color = active ? '#93c5fd' : '#e7eef6'
    }
  }

  sync(): void {
    if (!this.anchor?.isConnected || this.suppressed) {
      this.host.style.display = 'none'
      return
    }
    this.host.style.display = 'flex'
    const rect = this.anchor.getBoundingClientRect()
    const view = this.doc.defaultView
    const vw = view?.innerWidth ?? rect.right
    const vh = view?.innerHeight ?? rect.bottom
    const barRect = this.host.getBoundingClientRect()
    const width = barRect.width
    const height = barRect.height || 0
    let top = rect.top - height - 4
    if (top < 4) top = Math.min(rect.top + 4, Math.max(4, vh - height - 4))
    let left = rect.right - width
    if (left < 4) left = 4
    if (left + width > vw - 4) left = Math.max(4, vw - width - 4)
    this.host.style.top = `${top}px`
    this.host.style.left = `${left}px`
    this.updateScrollButtons()
  }

  remove(): void {
    this.anchor = null
    this.host.remove()
  }

  private render(): void {
    this.scroller.replaceChildren()
    this.chipToNode = new WeakMap()
    if (!this.anchor) return
    for (const node of ancestorChain(this.anchor)) {
      const chip = this.doc.createElement('span')
      chip.dataset.elementPicker = 'path-node'
      Object.assign(chip.style, CHIP_STYLE)
      chip.textContent = nodeLabel(node)
      chip.title = nodeLabel(node)
      this.chipToNode.set(chip, node)
      this.scroller.appendChild(chip)
    }
  }

  private scrollToEnd(): void {
    const view = this.doc.defaultView
    const align = () => {
      this.scroller.scrollLeft = this.scroller.scrollWidth
      this.updateScrollButtons()
    }
    align()
    view?.requestAnimationFrame(align)
  }

  private updateScrollButtons(): void {
    const max = this.scroller.scrollWidth - this.scroller.clientWidth
    const left = this.scroller.scrollLeft
    this.setButtonEnabled(this.prevBtn, left > 1)
    this.setButtonEnabled(this.nextBtn, left < max - 1)
  }

  private setButtonEnabled(button: HTMLButtonElement, enabled: boolean): void {
    button.disabled = !enabled
    button.style.opacity = enabled ? '1' : '0.35'
    button.style.cursor = enabled ? 'pointer' : 'default'
  }

  private chipFromEvent(event: Event): HTMLElement | null {
    return (
      event
        .composedPath()
        .find(
          (node): node is HTMLElement =>
            node instanceof HTMLElement &&
            node.dataset.elementPicker === 'path-node',
        ) ?? null
    )
  }
}
