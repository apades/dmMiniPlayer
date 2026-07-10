import { ATTR_DISABLE_INJECT_PIP } from '@root/shared/config'
import isDev from '@root/shared/isDev'
import {
  DM_MINI_PLAYER_CONFIG,
  FLOAT_BTN_HIDDEN,
  LOCALE,
} from '@root/shared/storeKey'
import { createSettingPanel } from '@root/utils/createSettingPanel'
import { Language, t } from '@root/utils/i18n'
import {
  setBrowserLocalStorage,
  setBrowserSyncStorage,
  useBrowserSyncStorage,
} from '@root/utils/storage'
import { isUndefined } from 'lodash-es'
import { autorun, configure } from 'mobx'
import config_base from './base'
import config_danmaku from './danmaku'
import { docPIPConfig } from './docPIP'
import config_features from './features'
import config_floatButton from './floatButton'
import config_shortcut from './shortcut'
import config_specialWebsites from './specialWebsites'
import config_subtitle from './subtitle'

export * from './base'

if (isDev) {
  configure({
    enforceActions: 'never',
  })
}

const {
  openSettingPanel,
  closeSettingPanel,
  observe,
  updateConfig,
  saveConfig,
  configStore,
} = createSettingPanel({
  settings: {
    ...config_floatButton,
    ...config_danmaku,
    ...config_specialWebsites,
    ...config_subtitle,
    ...docPIPConfig,
    ...config_shortcut,
    ...config_features,
    ...config_base,
  },
  saveKey: DM_MINI_PLAYER_CONFIG,
  async onSave(newConfig) {
    if (newConfig.language) {
      await setBrowserLocalStorage(LOCALE, newConfig.language as Language)
      location.reload()
      delete (newConfig as any).language
    }
    if (newConfig.useDocPIP) {
      if (!window?.documentPictureInPicture) {
        delete (newConfig as any).useDocPIP
        alert(t('settingPanel.unsupportDocPIPTips'))
      }
    }
    if (newConfig.injectPIPFn === false) {
      document.documentElement.setAttribute(ATTR_DISABLE_INJECT_PIP, 'true')
    } else {
      document.documentElement.removeAttribute(ATTR_DISABLE_INJECT_PIP)
    }
  },
})

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
  updateConfig({ floatButtonVisible: !val })
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
