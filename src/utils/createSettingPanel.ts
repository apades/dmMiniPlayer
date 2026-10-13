import { ConfigField, initSetting } from '@apad/setting-panel'
import en from '@apad/setting-panel/i18n/en.json'
import zh from '@apad/setting-panel/i18n/zh_cn.json'
import isPluginEnv from '@root/shared/isPluginEnv'
import { KeyType } from '@root/shared/storeKey'
import { makeAutoObservable, observe as mobxObserve } from 'mobx'
import { observer } from 'mobx-react'
import Browser from 'webextension-polyfill'
import isDev from '@root/shared/isDev'
import { getIsZh } from './i18n'
import {
  getBrowserLocalStorage,
  getBrowserSyncStorage,
  setBrowserLocalStorage,
  setBrowserSyncStorage,
  useBrowserLocalStorage,
  useBrowserSyncStorage,
} from './storage'

export function createSettingPanel<Config extends Record<string, any>>(props: {
  settings: {
    [K in keyof Config]: ConfigField<Config[K]>
  }
  saveKey: KeyType<any>
  saveInLocal?: boolean
  onSave?: Parameters<typeof initSetting<Config>>[0]['onSave']
  onInitLoadConfig?: Parameters<
    typeof initSetting<Config>
  >[0]['onInitLoadConfig']
}): ReturnType<typeof initSetting<Config>> {
  const { settings, saveKey, onSave, onInitLoadConfig } = props

  const saveInLocal = props.saveInLocal ?? !isPluginEnv
  const saveConfigWithExtStorage = (config: any) => {
    if (saveInLocal) return setBrowserLocalStorage(saveKey, config)
    else return setBrowserSyncStorage(saveKey, config)
  }
  const getConfigWithExtStorage = () => {
    if (saveInLocal) return getBrowserLocalStorage(saveKey)
    else return getBrowserSyncStorage(saveKey)
  }
  const useConfigWithExtStorage = (fn: (config: any) => void) => {
    if (saveInLocal) return useBrowserLocalStorage(saveKey, fn)
    else return useBrowserSyncStorage(saveKey, fn)
  }

  const {
    configStore,
    openSettingPanel,
    closeSettingPanel,
    observe,
    updateConfig,
    saveConfig,
  } = initSetting<Config>({
    settings,
    saveInLocal: !isPluginEnv,
    mobx: { makeAutoObservable, observer, observe: mobxObserve },
    i18n: getIsZh() ? zh : en,
    useShadowDom: isPluginEnv,
    ...(isPluginEnv && isDev
      ? { styleHref: Browser.runtime.getURL('/setting-panel.css') }
      : {}),
    async onSave(config) {
      await onSave?.(config)

      saveConfigWithExtStorage(config)
    },
    async onInitLoadConfig(config) {
      if (!isPluginEnv) return config

      if (onInitLoadConfig) {
        const newConfig = await onInitLoadConfig(config)
        if (newConfig) config = newConfig
      }

      // 这里去掉as any会触发ts的循环type错误
      const savedConfig = (await getConfigWithExtStorage()) as any

      const loadedConfig = {
        ...config,
        ...(savedConfig ?? {}),
      } as typeof config

      return loadedConfig
    },
  })

  // 同步多个tab的config
  if (isPluginEnv) {
    let unListenUpdate = () => {}
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState !== 'visible') return unListenUpdate()

      unListenUpdate()
      unListenUpdate = useConfigWithExtStorage(updateConfig)
    })

    if (document.visibilityState === 'visible') {
      unListenUpdate = useConfigWithExtStorage(updateConfig)
    }
  }

  return {
    configStore,
    openSettingPanel,
    closeSettingPanel,
    observe,
    updateConfig,
    saveConfig,
  }
}
