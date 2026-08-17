import { ElementPicker } from '@apad/element-picker'
import {
  isPickerMessage,
  toPickerOptions,
  type PickerResponse,
  type SerializablePickerOptions,
} from '../shared'

let picker: ElementPicker | null = null

export default function initial() {
  const onMessage = (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: PickerResponse) => void,
  ) => {
    if (!isPickerMessage(message)) return

    try {
      if (message.action === 'start') {
        startPicker(message.options)
      } else if (message.action === 'stop') {
        picker?.stop()
      } else {
        destroyPicker()
      }
      sendResponse({ ok: true })
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  chrome.runtime.onMessage.addListener(onMessage)
  return () => {
    chrome.runtime.onMessage.removeListener(onMessage)
    destroyPicker()
  }
}

function startPicker(options: SerializablePickerOptions): void {
  destroyPicker()
  picker = new ElementPicker(toPickerOptions(options))
  picker.on('confirm', ({ cssSelector, elements }) => {
    console.log('[element-picker] confirm', cssSelector, elements)
  })
  picker.on('close', () => {
    picker = null
  })
  picker.start()
}

function destroyPicker(): void {
  picker?.destroy()
  picker = null
}
