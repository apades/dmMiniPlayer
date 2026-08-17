import type {
  PickerMessage,
  PickerResponse,
  SerializablePickerOptions,
} from '../shared'

const STORAGE_KEY = 'element-picker-form'

type FormState = {
  type: 'single' | 'list'
  selector: string
  observerAllDomChange: boolean
}

const form = document.querySelector<HTMLFormElement>('#picker-form')!
const observerField = document.querySelector('#observer-field')!
const observerInput = form.elements.namedItem(
  'observerAllDomChange',
) as HTMLInputElement
const statusEl = document.querySelector('#status')!
const stopBtn = document.querySelector<HTMLButtonElement>('#stop')!
const destroyBtn = document.querySelector<HTMLButtonElement>('#destroy')!

restoreForm()
syncObserverField()

form.addEventListener('change', () => {
  syncObserverField()
  persistForm()
})
form.addEventListener('input', persistForm)

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  persistForm()
  const response = await sendToActiveTab({
    action: 'start',
    options: readOptions(),
  })
  if (!response.ok) {
    setStatus(response.error, true)
    return
  }
  window.close()
})

stopBtn.addEventListener('click', async () => {
  const response = await sendToActiveTab({ action: 'stop' })
  setStatus(response.ok ? 'Stopped' : response.error, !response.ok)
})

destroyBtn.addEventListener('click', async () => {
  const response = await sendToActiveTab({ action: 'destroy' })
  setStatus(response.ok ? 'Destroyed' : response.error, !response.ok)
})

function readOptions(): SerializablePickerOptions {
  const data = new FormData(form)
  const type = data.get('type') === 'list' ? 'list' : 'single'
  const selector = parseSelector(String(data.get('selector') ?? ''))
  const options: SerializablePickerOptions = { type }
  if (selector != null) options.selector = selector
  if (type === 'list' && observerInput.checked) {
    options.observerAllDomChange = true
  }
  return options
}

function parseSelector(raw: string): string | string[] | undefined {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return undefined
  return lines.length === 1 ? lines[0] : lines
}

function selectedType(): 'single' | 'list' {
  const data = new FormData(form)
  return data.get('type') === 'list' ? 'list' : 'single'
}

function syncObserverField(): void {
  const enabled = selectedType() === 'list'
  observerField.classList.toggle('is-disabled', !enabled)
  observerInput.disabled = !enabled
  if (!enabled) observerInput.checked = false
}

function persistForm(): void {
  const state: FormState = {
    type: selectedType(),
    selector: String(new FormData(form).get('selector') ?? ''),
    observerAllDomChange: selectedType() === 'list' && observerInput.checked,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function restoreForm(): void {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const state = JSON.parse(raw) as FormState
    const typeInput = form.querySelector<HTMLInputElement>(
      `input[name="type"][value="${state.type === 'list' ? 'list' : 'single'}"]`,
    )
    if (typeInput) typeInput.checked = true
    const selectorInput = form.elements.namedItem('selector')
    if (selectorInput instanceof HTMLTextAreaElement) {
      selectorInput.value =
        typeof state.selector === 'string' ? state.selector : ''
    }
    observerInput.checked = !!state.observerAllDomChange
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function setStatus(text: string, isError = false): void {
  statusEl.textContent = text
  statusEl.classList.toggle('is-error', isError)
}

async function sendToActiveTab(
  message: PickerMessage,
): Promise<PickerResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id == null) return { ok: false, error: 'No active tab' }
  try {
    const response = (await chrome.tabs.sendMessage(tab.id, message)) as
      PickerResponse | undefined
    return response ?? { ok: false, error: 'No response from content script' }
  } catch {
    return {
      ok: false,
      error: 'Content script not ready. Refresh the page and try again.',
    }
  }
}
