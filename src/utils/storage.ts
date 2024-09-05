import Browser from 'webextension-polyfill'

export function useBrowserLocalStorage<
  T extends (string & { __key: any }) | string
>(
  key: T,
  callback: (
    val: (T extends string & { __key: any } ? T['__key'] : any) | undefined
  ) => void
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

export function useBrowserSyncStorage<
  T extends (string & { __key: any }) | string
>(
  key: T,
  callback: (
    val: (T extends string & { __key: any } ? T['__key'] : any) | undefined
  ) => void
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
