import type configStore from '@root/store/config'
import type { Language } from '@root/utils/i18n'

function key<T = any>(key: string) {
  return key as string & { __key: T }
}

export type KeyType<T extends { __key: any }> = T['__key']

export const FLOAT_BTN_HIDDEN = key<boolean>('FLOAT_BTN_HIDDEN')
export const PIP_WINDOW_CONFIG = key<{
  width: number
  height: number
  left: number
  top: number
  mainDPR: number
  pipDPR: number
}>('PIP_WINDOW_CONFIG')
export const DM_MINI_PLAYER_CONFIG = key<typeof configStore>('LOCAL_CONFIG')

export const DRAG_POS = key<{
  x: number
  y: number
  xType: 'left' | 'right'
  yType: 'top' | 'bottom'
}>('DRAG_POS')

export const LATEST_SAVE_VERSION = key<string>('LATEST_SAVE_VERSION')

export const LOCALE = key<Language>('LOCALE')

export const DANMAKU_VISIBLE = key<boolean>('DANMAKU_VISIBLE')
