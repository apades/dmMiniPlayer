import 'webext-bridge/background'
import './commands'
import { onMessage, sendMessage } from 'webext-bridge/background'
import Browser from 'webextension-polyfill'
import { t } from '@root/utils/i18n'
import { FLOAT_BTN_HIDDEN, LOCALE } from '@root/shared/storeKey'
import {
  getBrowserLocalStorage,
  setBrowserSyncStorage,
  useBrowserLocalStorage,
  useBrowserSyncStorage,
} from '@root/utils/storage'
import WebextEvent from '@root/shared/webextEvent'
import getDanmakuGetter from '@pkgs/danmakuGetter/getDanmakuGetter'
import { v4 as uuid } from 'uuid'

console.log('run bg')
getBrowserLocalStorage(LOCALE).then((locale) => {
  if (!locale) return
  ;(globalThis as any).__LOCALE = locale
})

onMessage(WebextEvent.needClickWebToOpenPIP, (req) => {
  Browser.notifications.create(new Date().getTime() + '', {
    type: 'basic',
    message: '由于浏览器限制，需要去网页上随便点击下才能显示画中画',
    title: '报错',
    iconUrl: Browser.runtime.getURL('/assets/icon.png'),
    ...{ requireInteraction: true },
  })
})
onMessage(WebextEvent.bgFetch, async (req) => {
  const data = req.data
  const type = data.options?.type ?? 'json'
  const fetchRes = await fetch(data.url, data.options).then(async (res) => {
    switch (type) {
      case 'json':
        return res.json()
      case 'text':
        return res.text()
      case 'blob': {
        const blob = await res.blob()
        return URL.createObjectURL(blob)
      }
    }
  })

  return fetchRes
})

onMessage(WebextEvent.getup, () => 'hello')

const getTabCapturePermission = () =>
  new Promise<boolean>((res) => {
    chrome.permissions.contains({ permissions: ['tabCapture'] }, (rs) => {
      if (rs) return res(true)
      chrome.permissions.request({ permissions: ['tabCapture'] }, (rs) => {
        res(rs)
      })
    })
  })

onMessage(WebextEvent.getTabCapturePermission, getTabCapturePermission)
onMessage(WebextEvent.startTabCapture, (req) => {
  const tabId = req.sender.tabId
  return new Promise(async (res) => {
    const hasPermission = await getTabCapturePermission()
    if (!hasPermission) return res({ error: 'no permission' })
    chrome.tabCapture.getMediaStreamId(
      { targetTabId: tabId, consumerTabId: tabId },
      (streamId) => res({ streamId })
    )
  })
})

const danmakuGetterCacheMap = new Map<
  string,
  ReturnType<typeof getDanmakuGetter>
>()
onMessage(WebextEvent.setGetDanmaku, (req) => {
  const { data, sender } = req
  const senderId = sender.tabId
  const id = uuid()
  const danmakuGetter = getDanmakuGetter(data)
  danmakuGetter.init()
  danmakuGetter.on('addDanmakus', (data) => {
    sendMessage(
      WebextEvent.getDanmaku,
      { data },
      {
        tabId: senderId,
        context: 'content-script',
      }
    )
  })
  danmakuGetter.on('config', (config) =>
    sendMessage(
      WebextEvent.getDanmaku,
      { config },
      {
        tabId: senderId,
        context: 'content-script',
      }
    )
  )
  danmakuGetter.on('error', (err) =>
    sendMessage(
      WebextEvent.getDanmaku,
      { err },
      {
        tabId: senderId,
        context: 'content-script',
      }
    )
  )

  danmakuGetterCacheMap.set(id, danmakuGetter)
  return { id }
})
onMessage(WebextEvent.stopGetDanmaku, ({ data }) => {
  const danmakuGetter = danmakuGetterCacheMap.get(data.id)
  if (danmakuGetter) {
    danmakuGetter.unload()
    danmakuGetterCacheMap.delete(data.id)
  }
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

// 很奇怪的需要延迟点才不会触发'Cannot find menu item with id'
setTimeout(() => {
  useBrowserLocalStorage(LOCALE, (locale) => {
    if (!locale) return
    ;(globalThis as any).__LOCALE = locale
    Browser.contextMenus.update(FLOAT_BTN_ID, {
      title: t('menu.showFloatBtn'),
    })
    Browser.contextMenus.update(SETTING_ID, {
      title: t('menu.openSetting'),
    })
  })
  useBrowserSyncStorage(FLOAT_BTN_HIDDEN, (val) => {
    Browser.contextMenus.update(FLOAT_BTN_ID, {
      checked: !val,
    })
  })
}, 50)

Browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case FLOAT_BTN_ID: {
      setBrowserSyncStorage(FLOAT_BTN_HIDDEN, !info.checked)
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
