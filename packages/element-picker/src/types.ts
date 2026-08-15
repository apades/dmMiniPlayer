export type Selector = string | HTMLElement

export type ElementPickerType = 'single' | 'list'

export type ElementPickerOptions = {
  selector?: Selector | Selector[]
  /**
   * @default 'single'
   */
  type?: ElementPickerType
  /**
   * Watch all DOM mutations and refresh the matched list in `list` mode.
   * May be expensive on busy pages.
   * @default false
   */
  observerAllDomChange?: boolean
}

export type FeatureKind = 'tag' | 'class' | 'attr'

export type ElementFeature =
  | { kind: 'tag'; value: string }
  | { kind: 'class'; value: string }
  | { kind: 'attr'; name: string; value: string }

export type ElementPickerConfirmPayload = {
  elements: HTMLElement[]
  cssSelector: string
}

export type ElementPickerEvents = {
  hover: HTMLElement | null
  select: HTMLElement[]
  change: HTMLElement[]
  exclude: HTMLElement
  confirm: ElementPickerConfirmPayload
  close: undefined
  stop: undefined
}
