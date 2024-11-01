import type configStore from '@root/store/config'

function key<T = any>(key: string) {
  return key as string & { __key: T }
}

export type KeyType<T extends { __key: any }> = T['__key']

export const FLOAT_BTN_HIDDEN = key<boolean>('FLOAT_BTN_HIDDEN')
export const PIP_WINDOW_CONFIG = key<{ width: number; height: number }>(
  'PIP_WINDOW_CONFIG'
)
export const DM_MINI_PLAYER_CONFIG = key<typeof configStore>('LOCAL_CONFIG')

export const DRAG_POS = key<{
  x: number
  y: number
  xType: 'left' | 'right'
  yType: 'top' | 'bottom'
}>('DRAG_POS')
