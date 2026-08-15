export type PanelState = {
  type: string
  cssSelector: string
  count: number
}

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
`

export class PickerPanel {
  readonly host: HTMLDivElement
  private modeEl: HTMLElement
  private countMeta: HTMLElement
  private countEl: HTMLElement
  private queryEl: HTMLElement

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
    root.className = 'panel'
    root.innerHTML = `
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
    `

    shadow.append(style, root)
    this.modeEl = shadow.querySelector('[data-role="mode"]')!
    this.countMeta = shadow.querySelector('[data-role="count-meta"]')!
    this.countEl = shadow.querySelector('[data-role="count"]')!
    this.queryEl = shadow.querySelector('[data-role="query"]')!

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
    this.host.remove()
  }

  update(state: PanelState): void {
    this.modeEl.textContent = state.type
    this.queryEl.textContent = state.cssSelector || '-'
    const showCount = state.type === 'list'
    this.countMeta.hidden = !showCount
    if (showCount) this.countEl.textContent = String(state.count)
  }
}
