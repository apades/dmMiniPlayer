import Browser from 'webextension-polyfill'

Browser.storage.local.onChanged.addListener((changes) => {
  Object.keys(changes).forEach((key) => {
    localCallbacksMap[key]?.forEach?.((cb) => cb(changes[key].newValue))
  })
})
const localCallbacksMap: Record<string, ((v: any) => void)[]> = {}
export function useBrowserLocalStorage<
  T extends (string & { __key: any }) | string
>(
  key: T,
  callback: (
    val: (T extends string & { __key: any } ? T['__key'] : any) | undefined
  ) => void
) {
  if (!localCallbacksMap[key]) {
    localCallbacksMap[key] = []
  }
  localCallbacksMap[key].push(callback)
  return () => {
    localCallbacksMap[key].slice(localCallbacksMap[key].indexOf(callback), 1)
  }
}

export function setBrowserLocalStorage<
  T extends (string & { __key: any }) | string
>(key: T, value: T extends string & { __key: any } ? T['__key'] : any) {
  return Browser.storage.local.set({ [key]: value })
}

export function getBrowserLocalStorage<
  T extends (string & { __key: any }) | string
>(key: T) {
  return Browser.storage.local
    .get(key as any)
    .then(
      ({ [key as any]: val }) =>
        val as
          | (T extends string & { __key: any } ? T['__key'] : any)
          | undefined
    )
}

Browser.storage.sync.onChanged.addListener((changes) => {
  Object.keys(changes).forEach((key) => {
    syncCallbacksMap[key]?.forEach?.((cb) => cb(changes[key].newValue))
  })
})
const syncCallbacksMap: Record<string, ((v: any) => void)[]> = {}
export function useBrowserSyncStorage<
  T extends (string & { __key: any }) | string
>(
  key: T,
  callback: (
    val: (T extends string & { __key: any } ? T['__key'] : any) | undefined
  ) => void
) {
  if (!syncCallbacksMap[key]) {
    syncCallbacksMap[key] = []
  }
  syncCallbacksMap[key].push(callback)
  return () => {
    syncCallbacksMap[key].slice(syncCallbacksMap[key].indexOf(callback), 1)
  }
}

export function setBrowserSyncStorage<
  T extends (string & { __key: any }) | string
>(key: T, value: T extends string & { __key: any } ? T['__key'] : any) {
  return Browser.storage.sync.set({ [key]: value })
}

export function getBrowserSyncStorage<
  T extends (string & { __key: any }) | string
>(key: T) {
  return Browser.storage.sync
    .get(key as any)
    .then(
      ({ [key as any]: val }) =>
        val as
          | (T extends string & { __key: any } ? T['__key'] : any)
          | undefined
    )
}
