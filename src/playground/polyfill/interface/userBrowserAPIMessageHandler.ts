// 该文件给user webview
import type Browser from 'webextension-polyfill'
import { executeCallback } from '../browser'
import { getPort } from '../browser/items'
import _env from '../env'
import { onMessage } from '../message'
import { objectDeepProxy } from '../utils'

onMessage('browser-API', (content) => {
  switch (content.type) {
    case 'tabs-create': {
      return window.open(content.data.url)
    }
  }
})

// message通信处理
onMessage('browser-API', (content) => {
  switch (content.type) {
    case 'runtime-sendMessage': {
      const senderPolyfill: Browser.Runtime.MessageSender = {
          tab: { id: content?.from?.tabId || _env.tabId },
        } as any,
        sender = objectDeepProxy(senderPolyfill, 'runtime-sendMessage:sender')

      return executeCallback('runtime-onMessage', content.data, sender)
    }
    case 'runtime-connect-postMessage': {
      return executeCallback('runtime-connect-onMessage', content.data)
    }
  }
})

onMessage('browser-API', (content) => {
  switch (content.type) {
    case 'runtime-connect-postMessage': {
      return executeCallback('runtime-connect-onMessage', content.data)
    }
    case 'runtime-connect': {
      return executeCallback('runtime-connect', getPort())
    }
  }
})
