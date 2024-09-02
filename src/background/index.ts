import 'webext-bridge/background'
import './commands'
import './messages/bgFetch'
import { onMessage, sendMessage } from 'webext-bridge/background'
import Browser from 'webextension-polyfill'
import { t } from '@root/utils/i18n'
import { FLOAT_BTN_HIDDEN } from '@root/shared/storeKey'
import {
  setBrowserLocalStorage,
  useBrowserLocalStorage,
} from '@root/utils/storage'
// import './messages/bgFetch'

console.log('run bg')
onMessage('PIP-need-click-notifications', (req) => {
  Browser.notifications.create(new Date().getTime() + '', {
    type: 'basic',
    message: '由于浏览器限制，需要去网页上随便点击下才能显示画中画',
    title: '报错',
    iconUrl: Browser.runtime.getURL('/assets/icon.png'),
    ...{ requireInteraction: true },
  })
})

const FLOAT_BTN_ID = 'FLOAT_BTN_ID',
  SETTING_ID = 'SETTING_ID'
Browser.runtime.onInstalled.addListener(() => {
  Browser.contextMenus.create({
    contexts: ['action'],
    type: 'checkbox',
    title: t('menu.showFloatBtn'),
    id: FLOAT_BTN_ID,
  })
  Browser.contextMenus.create({
    contexts: ['action'],
    title: t('menu.openSetting'),
    id: SETTING_ID,
  })
})

useBrowserLocalStorage(FLOAT_BTN_HIDDEN, (val) => {
  Browser.contextMenus.update(FLOAT_BTN_ID, {
    checked: !val,
  })
})

Browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case FLOAT_BTN_ID: {
      setBrowserLocalStorage(FLOAT_BTN_HIDDEN, !info.checked)
      break
    }
    case SETTING_ID: {
      if (tab?.id) {
        sendMessage('open-setting', null, {
          tabId: tab.id,
          context: 'content-script',
        })
      }
    }
  }
})
