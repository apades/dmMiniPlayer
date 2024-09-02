function key<T = any>(key: string) {
  return key as string & { __key: T }
}

export const FLOAT_BTN_HIDDEN = key<boolean>('FLOAT_BTN_HIDDEN')
export const PIP_WINDOW_CONFIG = key<{ width: number; height: number }>(
  'PIP_WINDOW_CONFIG'
)
