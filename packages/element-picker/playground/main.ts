import { ElementPicker } from '@apad/element-picker'
import type { ElementPickerOptions } from '@apad/element-picker'
import './style.css'

type PlaygroundAPI = {
  ElementPicker: typeof ElementPicker
  createPicker: (options: ElementPickerOptions) => ElementPicker
  getPicker: () => ElementPicker | null
  destroyPicker: () => void
}

let picker: ElementPicker | null = null

const status = {
  type: document.querySelector('[data-status="type"]')!,
  count: document.querySelector('[data-status="count"]')!,
  selector: document.querySelector('[data-status="selector"]')!,
  features: document.querySelector('[data-status="features"]')!,
}

function renderStatus(): void {
  if (!picker) {
    status.type.textContent = '-'
    status.count.textContent = '0'
    status.selector.textContent = '-'
    status.features.textContent = '-'
    return
  }
  status.type.textContent = picker.type
  status.count.textContent = String(picker.elements.length)
  status.selector.textContent = picker.cssSelector || '-'
  status.features.textContent = picker.features.length
    ? JSON.stringify(picker.features)
    : '-'
}

function destroyPicker(): void {
  picker?.destroy()
  picker = null
  renderStatus()
}

async function copySelector(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const input = document.createElement('textarea')
    input.value = text
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    input.remove()
  }
}

function createPicker(options: ElementPickerOptions): ElementPicker {
  destroyPicker()
  picker = new ElementPicker(options)
  picker.on('change', renderStatus)
  picker.on('select', renderStatus)
  picker.on('exclude', renderStatus)
  picker.on('stop', renderStatus)
  picker.on('confirm', ({ cssSelector }) => {
    void copySelector(cssSelector)
    renderStatus()
  })
  picker.on('close', () => {
    picker = null
    renderStatus()
  })
  if (options.selector == null) picker.start()
  renderStatus()
  return picker
}

const actions: Record<string, () => void> = {
  single: () => createPicker({ type: 'single' }),
  list: () => createPicker({ type: 'list' }),
  'highlight-hero': () => createPicker({ selector: '.hero' }),
  'highlight-cards': () => createPicker({ selector: ['.card'] }),
  stop: () => picker?.stop(),
  destroy: destroyPicker,
}

document.querySelector('.actions')?.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  const action = target.dataset.action
  if (!action || !actions[action]) return
  actions[action]()
})

const api: PlaygroundAPI = {
  ElementPicker,
  createPicker,
  getPicker: () => picker,
  destroyPicker,
}

Object.assign(window, { __elementPickerPlayground: api })
renderStatus()
