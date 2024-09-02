import Browser from 'webextension-polyfill'

export const PIP_WINDOW_CONFIG = 'PIP_WINDOW_CONFIG'
const _extStorage = Browser.storage.sync

export const extStorage = {
  async get<T = Record<any, any>>(key: string) {
    return (await Browser.storage.sync.get(key))[key] as T
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

export function useBrowserLocalStorage<T extends string & { __key: any }>(
  key: T,
  callback: (val: T['__key']) => void
) {
  const listen = (changes: Record<any, any>) => {
    if (changes[key]) {
      callback(changes[key].newValue)
    }
  }
  Browser.storage.local.get(key as any).then(({ [key as any]: val }) => {
    callback(val)
  })

  Browser.storage.local.onChanged.addListener(listen)

  return () => {
    Browser.storage.local.onChanged.removeListener(listen)
  }
}

export function setBrowserLocalStorage<T extends string & { __key: any }>(
  key: T,
  value: T['__key']
) {
  return Browser.storage.local.set({ [key]: value })
}

export function getBrowserLocalStorage<T extends string & { __key: any }>(
  key: T
) {
  return Browser.storage.local
    .get(key as any)
    .then(({ [key as any]: val }) => val)
}

export function useBrowserSyncStorage<T extends string & { __key: any }>(
  key: T,
  callback: (val: T['__key']) => void
) {
  const listen = (changes: Record<any, any>) => {
    if (changes[key]) {
      callback(changes[key].newValue)
    }
  }
  Browser.storage.sync.get(key as any).then(({ [key as any]: val }) => {
    callback(val)
  })

  Browser.storage.sync.onChanged.addListener(listen)

  return () => {
    Browser.storage.sync.onChanged.removeListener(listen)
  }
}

export function setBrowserSyncStorage<T extends string & { __key: any }>(
  key: T,
  value: T['__key']
) {
  return Browser.storage.sync.set({ [key]: value })
}

export function getBrowserSyncStorage<T extends string & { __key: any }>(
  key: T
) {
  return Browser.storage.sync
    .get(key as any)
    .then(({ [key as any]: val }) => val)
}
