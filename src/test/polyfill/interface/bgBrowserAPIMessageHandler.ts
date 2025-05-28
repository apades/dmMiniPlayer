// 该文件给user webview
import type Browser from 'webextension-polyfill'
import { executeCallback } from '../browser'
import { getPort } from '../browser/items'
import _env from '../env'
import { onMessage, sendMessage } from '../message'
import { objectDeepProxy } from '../utils'

// 普通数据处理
onMessage('browser-API', (content) => {
  let data = null
  switch (content.type) {
    case 'storage-get': {
      data = JSON.parse(localStorage.storage || '{}')
      break
    }
    case 'storage-set': {
      const oldData = JSON.parse(localStorage.storage || '{}')
      Object.assign(oldData, content.data)
      localStorage.storage = JSON.stringify(oldData)
      break
    }
    case 'tabs-create': {
      data = content.data
      break
    }
  }
  sendMessage('browser-API', {
    isResp: true,
    type: content.type,
    data,
  })
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
