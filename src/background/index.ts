import 'webext-bridge/background'
import './commands'
import { onMessage, sendMessage } from 'webext-bridge/background'
import Browser from 'webextension-polyfill'
import { t } from '@root/utils/i18n'
import { FLOAT_BTN_HIDDEN } from '@root/shared/storeKey'
import {
  setBrowserSyncStorage,
  useBrowserSyncStorage,
} from '@root/utils/storage'
import WebextEvent from '@root/shared/webextEvent'
import getDanmakuGetter from '@pkgs/danmakuGetter/getDanmakuGetter'
import { v4 as uuid } from 'uuid'

console.log('run bg')
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

useBrowserSyncStorage(FLOAT_BTN_HIDDEN, (val) => {
  Browser.contextMenus.update(FLOAT_BTN_ID, {
    checked: !val,
  })
})

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
