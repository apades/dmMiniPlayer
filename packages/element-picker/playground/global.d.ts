import type { ElementPicker, ElementPickerOptions } from '../src'

export type PlaygroundAPI = {
  ElementPicker: typeof ElementPicker
  createPicker: (options: ElementPickerOptions) => ElementPicker
  getPicker: () => ElementPicker | null
  destroyPicker: () => void
}

declare global {
  interface Window {
    __elementPickerPlayground: PlaygroundAPI
  }
}

export {}
