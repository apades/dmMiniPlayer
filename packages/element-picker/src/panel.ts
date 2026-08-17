export type PanelState = {
  type: string
  cssSelector: string
  count: number
}

const HINT_MS = 2800

const PANEL_CSS = `
  :host {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    z-index: 2147483647;
    pointer-events: auto;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .wrap {
    display: grid;
    gap: 6px;
  }
  .panel {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 320px;
    max-width: min(720px, calc(100vw - 32px));
    padding: 10px 12px;
    border: 1px solid #2a3542;
    border-radius: 12px;
    background: #171e27;
    color: #e7eef6;
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.35);
  }
  .meta {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .label {
    color: #93a1b1;
    font-size: 11px;
    line-height: 1.2;
  }
  .value {
    font-size: 13px;
    line-height: 1.4;
    word-break: break-all;
  }
  .query {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: #22c55e;
  }
  .hint {
    padding: 8px 12px;
    border: 1px solid #92400e;
    border-radius: 10px;
    background: #2a2010;
    color: #fbbf24;
    font-size: 12px;
    line-height: 1.4;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    margin-left: auto;
  }
  button {
    border: 1px solid #2a3542;
    border-radius: 999px;
    padding: 6px 12px;
    background: #10161d;
    color: #e7eef6;
    cursor: pointer;
    font-size: 13px;
  }
  button.confirm {
    background: #166534;
    border-color: #22c55e;
  }
  .meta[hidden],
  .hint[hidden] {
    display: none !important;
  }
`

export class PickerPanel {
  readonly host: HTMLDivElement
  private modeEl: HTMLElement
  private countMeta: HTMLElement
  private countEl: HTMLElement
  private queryEl: HTMLElement
  private hintEl: HTMLElement
  private hintTimer = 0
  private hintView: Window | null = null

  constructor(
    private doc: Document,
    handlers: { onConfirm: () => void; onClose: () => void },
  ) {
    this.host = doc.createElement('div')
    this.host.dataset.elementPicker = 'panel'
    const shadow = this.host.attachShadow({ mode: 'open' })

    const style = doc.createElement('style')
    style.textContent = PANEL_CSS

    const root = doc.createElement('div')
    root.className = 'wrap'
    root.innerHTML = `
      <div class="panel">
        <div class="meta">
          <div class="label">Mode</div>
          <div class="value" data-role="mode">-</div>
        </div>
        <div class="meta" data-role="count-meta" hidden>
          <div class="label">Count</div>
          <div class="value" data-role="count">0</div>
        </div>
        <div class="meta">
          <div class="label">Selector</div>
          <div class="value query" data-role="query">-</div>
        </div>
        <div class="actions">
          <button type="button" class="confirm" data-role="confirm">Confirm</button>
          <button type="button" data-role="close">Close</button>
        </div>
      </div>
      <div class="hint" data-role="hint" hidden></div>
    `

    shadow.append(style, root)
    this.modeEl = shadow.querySelector('[data-role="mode"]')!
    this.countMeta = shadow.querySelector('[data-role="count-meta"]')!
    this.countEl = shadow.querySelector('[data-role="count"]')!
    this.queryEl = shadow.querySelector('[data-role="query"]')!
    this.hintEl = shadow.querySelector('[data-role="hint"]')!

    shadow
      .querySelector('[data-role="confirm"]')!
      .addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        handlers.onConfirm()
      })
    shadow
      .querySelector('[data-role="close"]')!
      .addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        handlers.onClose()
      })
  }

  get mounted(): boolean {
    return this.host.isConnected
  }

  mount(parent: Element = this.doc.documentElement): void {
    if (!this.mounted) parent.appendChild(this.host)
  }

  unmount(): void {
    this.clearHint()
    this.host.remove()
  }

  update(state: PanelState): void {
    this.modeEl.textContent = state.type
    this.queryEl.textContent = state.cssSelector || '-'
    const showCount = state.type === 'list'
    this.countMeta.hidden = !showCount
    if (showCount) this.countEl.textContent = String(state.count)
  }

  showHint(message: string): void {
    this.clearHint()
    this.hintEl.textContent = message
    this.hintEl.hidden = false
    const view = this.doc.defaultView
    if (!view) return
    this.hintView = view
    this.hintTimer = view.setTimeout(() => {
      this.clearHint()
    }, HINT_MS)
  }

  clearHint(): void {
    if (this.hintTimer) {
      this.hintView?.clearTimeout(this.hintTimer)
      this.hintTimer = 0
      this.hintView = null
    }
    this.hintEl.hidden = true
    this.hintEl.textContent = ''
  }
}
