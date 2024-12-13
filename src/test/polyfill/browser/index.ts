/* eslint-disable @typescript-eslint/no-unsafe-function-type */
// 防止出现调用没用改到的api抛出错误
import type Browser from 'webextension-polyfill'
import type { Tabs } from 'webextension-polyfill'
import _env from '../env'
import { sendMessage, sendMessageWaitResp } from '../message'
import { objectDeepProxy } from '../utils'
import { getPort } from './items'
import storage from './storage'

export const eventsCallbackMap: Record<string, Function[]> = {}
window.eventsCallbackMap = eventsCallbackMap
export function addCallback(type: string, callback: Function) {
  eventsCallbackMap[type] = eventsCallbackMap[type] || []
  eventsCallbackMap[type].push(callback)
}
export function removeCallback(type: string, callback: Function) {
  if (!eventsCallbackMap[type]) return
  eventsCallbackMap[type].splice(
    eventsCallbackMap[type].findIndex((cb) => cb == callback),
    1,
  )
}
export function executeCallback(type: string, ...data: any) {
  if (!eventsCallbackMap[type]) return
  eventsCallbackMap[type].forEach((cb) => cb(...data))
}

const BrowserPolyfill = {
  storage,
  cookies: {
    getAll: async (data: any) => {
      const cookies = await sendMessageWaitResp('browser-API', {
        type: 'cookies-getAll',
      })
      // ? 可能还要处理下
      return cookies
    },
  },
  contextMenus: {
    create: () => 1,
    onClicked: {
      addListener: () => 1,
    },
  },
  scripting: {
    executeScript: () => 1,
  },
  tabs: {
    create: (createProperties: Tabs.CreateCreatePropertiesType) => {
      const url = createProperties.url
      console.log('打开页面', url)
      if (url?.includes('chrome://extensions/shortcuts')) {
        // 这里需要mac设置打开快捷键？
      }
      if (url?.includes('setup.html')) {
        // 第一次安装插件的页面，mac不需要
      }
      if (url?.includes('get-key.html')) {
        // 获取api key的教程页面
      }
      if (url?.includes('options.html')) {
        // 设置页面
      }
      sendMessage('browser-API', {
        type: 'tabs-create',
        data: {
          url,
        },
      })
    },
    // 目前有看到send给chat的页面，也有bg发给页面PopupOpen的，都算在runtime.sendMessage
    sendMessage: (id: any, data: any) =>
      sendMessage('browser-API', {
        type: 'runtime-sendMessage',
        data,
      }),
    query: () => {
      const tabsPolyfill: Browser.Tabs.Tab[] = [{ id: 2 } as any]
      objectDeepProxy(tabsPolyfill, 'any')
    },
    // mac端不会用的
    onUpdated: {
      removeListener: () => 1,
      addListener: () => 1,
    },
    // 插件用来激活tab的active而已，mac用不到
    update: () => 1,
  },
  runtime: {
    onInstalled: {
      addListener: () => 1,
    },
    getManifest: () => ({}),
    // ? 这个是插件需要本地文件的路径，这里直接返回路径？
    getURL: (url: string) => {
      if (url[0] == '/') url = url.slice(1, url.length)
      if (url.indexOf('./') === 0) url = url.replace('./', '')
      if (_env.baseURLInGetURL) {
        return _env.baseURLInGetURL + '/' + url
      }
      return url
    },
    // 原本是page和bg的长连接，这里相当于runtime.sendMessage就行了
    // ?+ 还需要考虑connector的id?
    onConnect: {
      addListener: (callback: () => 1) =>
        addCallback('runtime-connect', callback),
    },
    onMessage: {
      addListener: (callback: () => 1) =>
        addCallback('runtime-onMessage', callback),
      removeListener: (callback: () => 1) =>
        removeCallback('runtime-onMessage', callback),
    },
    // 返回一个runtime.connect结构为主的runtime.sendMessage
    connect: () => {
      sendMessage('browser-API', {
        type: 'runtime-connect',
      })
      return getPort()
    },
    sendMessage: (data: any) =>
      sendMessage('browser-API', {
        type: 'runtime-sendMessage',
        data,
      }),
  },
  i18n: {
    // ? 这里插件还没用到，先不弄？
    getMessage: (messageName: string, substitutions?: string | string[]) => 1,
  },
}

const BrowserProxy = objectDeepProxy(BrowserPolyfill, 'BrowserPolyfill', {
  onNull(type, key) {
    switch (type) {
      case 'get':
        return sendMessage('error', {
          type: 'browser-polyfill',
          error: `缺少key ${key}`,
        })
      case 'apply':
        return sendMessage('error', {
          type: 'browser-polyfill',
          error: `缺少可执行函数`,
        })
    }
  },
})

window.BrowserPolyfill = BrowserPolyfill
window.Browser = BrowserProxy
export default BrowserProxy
