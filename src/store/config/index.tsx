import { initSetting } from '@apad/setting-panel'
import {
  getBrowserSyncStorage,
  setBrowserLocalStorage,
  setBrowserSyncStorage,
  useBrowserSyncStorage,
} from '@root/utils/storage'
import {
  autorun,
  makeAutoObservable,
  observe as mobxObserve,
  configure,
} from 'mobx'
import { observer } from 'mobx-react'
import zh from '@apad/setting-panel/i18n/zh_cn.json'
import en from '@apad/setting-panel/i18n/en.json'
import { getIsZh, t } from '@root/utils/i18n'
import {
  DM_MINI_PLAYER_CONFIG,
  FLOAT_BTN_HIDDEN,
  LOCALE,
} from '@root/shared/storeKey'
import isPluginEnv from '@root/shared/isPluginEnv'
import { isUndefined } from 'lodash-es'
import isDev from '@root/shared/isDev'
import Browser from 'webextension-polyfill'
import { ATTR_DISABLE_INJECT_PIP } from '@root/shared/config'
import config_floatButton from './floatButton'
import config_shortcut from './shortcut'
import config_subtitle from './subtitle'
import config_specialWebsites from './specialWebsites'
import config_danmaku from './danmaku'
import config_main from './main'
import { docPIPConfig } from './docPIP'
import config_features from './features'

if (isDev) {
  configure({
    enforceActions: 'never',
  })
}

export const baseConfigMap = {
  ...config_floatButton,
  ...config_danmaku,
  ...config_specialWebsites,
  ...config_subtitle,
  ...docPIPConfig,
  ...config_shortcut,
  ...config_features,
  ...config_main,
}

const {
  configStore,
  openSettingPanel,
  closeSettingPanel,
  observe,
  updateConfig: _updateConfig,
  saveConfig,
} = initSetting({
  settings: baseConfigMap,
  saveInLocal: !isPluginEnv,
  mobx: { makeAutoObservable, observer, observe: mobxObserve },
  i18n: getIsZh() ? zh : en,
  async onSave(newConfig) {
    if (newConfig.language) {
      await setBrowserLocalStorage(LOCALE, newConfig.language)
      location.reload()
      delete (newConfig as any).language
    }

    if (!isPluginEnv) return

    // 判断是否需要请求tabCapture权限
    // if (
    //   newConfig.notSameOriginIframeCaptureModePriority ===
    //     DocPIPRenderType.capture_tabCapture ||
    //   newConfig.docPIP_renderType === DocPIPRenderType.capture_tabCapture
    // ) {
    //   let sendFn = sendMessageInCs
    //   if (isBG) {
    //     sendFn = sendMessageInBg
    //   }
    //   const res = await sendFn(WebextEvent.getTabCapturePermission, null)
    //   if (!res) {
    //     newConfig.notSameOriginIframeCaptureModePriority =
    //       oldConfig.notSameOriginIframeCaptureModePriority
    //     newConfig.docPIP_renderType = oldConfig.docPIP_renderType
    //   }
    // }

    if (newConfig.useDocPIP) {
      if (!window?.documentPictureInPicture) {
        delete (newConfig as any).useDocPIP
        alert(t('settingPanel.unsupportDocPIPTips'))
      }
    }
    setBrowserSyncStorage(DM_MINI_PLAYER_CONFIG, newConfig)

    oldConfig = { ...oldConfig, ...newConfig }
  },
  async onInitLoadConfig(config) {
    if (!isPluginEnv) return config
    // 这里去掉as any会触发ts的循环type错误
    const savedConfig = (await getBrowserSyncStorage(
      DM_MINI_PLAYER_CONFIG,
    )) as any

    const loadedConfig = { ...config, ...(savedConfig ?? {}) } as typeof config

    // 去除旧config
    if (typeof loadedConfig.movePIPInOpen === 'boolean') {
      delete loadedConfig.movePIPInOpen
    }

    oldConfig = loadedConfig

    return loadedConfig
  },
  useShadowDom: isPluginEnv,
  ...(isPluginEnv && isDev
    ? { styleHref: Browser.runtime.getURL('/setting-panel.css') }
    : {}),
})
let oldConfig: Partial<typeof configStore>

const updateConfig = async (config?: Partial<typeof configStore>) => {
  config ??= await getBrowserSyncStorage(DM_MINI_PLAYER_CONFIG)
  if (!config) return

  if (config.injectPIPFn === false) {
    document.documentElement.setAttribute(ATTR_DISABLE_INJECT_PIP, 'true')
  } else {
    document.documentElement.removeAttribute(ATTR_DISABLE_INJECT_PIP)
  }
  _updateConfig(config)
}

// 同步多个tab的config
if (isPluginEnv) {
  let unListenUpdate = () => {}
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return unListenUpdate()

    unListenUpdate()
    unListenUpdate = useBrowserSyncStorage(DM_MINI_PLAYER_CONFIG, updateConfig)
  })

  if (document.visibilityState === 'visible') {
    unListenUpdate = useBrowserSyncStorage(DM_MINI_PLAYER_CONFIG, updateConfig)
  }
}

window.configStore = configStore
window.openSettingPanel = openSettingPanel

let firstChange = true
// 同步icon栏的修改隐藏floatButton
autorun(() => {
  const val = !configStore.floatButtonVisible
  // 第一次的值是不对的
  if (firstChange) {
    firstChange = false
    return
  }
  setBrowserSyncStorage(FLOAT_BTN_HIDDEN, val)
})
useBrowserSyncStorage(FLOAT_BTN_HIDDEN, async (val) => {
  if (isUndefined(val)) return
  _updateConfig({ floatButtonVisible: !val })
  saveConfig()
})

export default configStore
export {
  configStore,
  openSettingPanel,
  closeSettingPanel,
  observe,
  updateConfig,
  saveConfig,
}

export * from './main'
