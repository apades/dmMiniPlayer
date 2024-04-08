import Browser from 'webextension-polyfill'

export const PIP_WINDOW_CONFIG = 'PIP_WINDOW_CONFIG'
const _extStorage = Browser.storage.sync

export const extStorage = {
  get<T = Record<any, any>>(key: string) {
    return Browser.storage.sync.get(key) as T
  },
  set(key: string, value: any) {
    return Browser.storage.sync.set({ [key]: value })
  },
}

export type PIPWindowConfig = {
  width: number
  height: number
}
export function getPIPWindowConfig() {
  return extStorage.get<PIPWindowConfig>(PIP_WINDOW_CONFIG)
}

export function setPIPWindowConfig(config: PIPWindowConfig) {
  return extStorage.set(PIP_WINDOW_CONFIG, config)
}
