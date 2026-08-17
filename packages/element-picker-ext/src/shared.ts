import type { ElementPickerOptions, ElementPickerType } from '@apad/element-picker'

export type SerializablePickerOptions = {
  type: ElementPickerType
  selector?: string | string[]
  observerAllDomChange?: boolean
}

export type PickerStartMessage = {
  action: 'start'
  options: SerializablePickerOptions
}

export type PickerStopMessage = {
  action: 'stop'
}

export type PickerDestroyMessage = {
  action: 'destroy'
}

export type PickerMessage =
  | PickerStartMessage
  | PickerStopMessage
  | PickerDestroyMessage

export type PickerResponse = { ok: true } | { ok: false; error: string }

export function isPickerMessage(value: unknown): value is PickerMessage {
  if (!value || typeof value !== 'object') return false
  const action = (value as { action?: unknown }).action
  return action === 'start' || action === 'stop' || action === 'destroy'
}

export function toPickerOptions(
  options: SerializablePickerOptions,
): ElementPickerOptions {
  return {
    type: options.type,
    selector: options.selector,
    observerAllDomChange: options.observerAllDomChange,
  }
}
