import type { Runtime } from 'webextension-polyfill'
import { sendMessage } from '../message'
import { objectDeepProxy } from '../utils'
import { addCallback, executeCallback, removeCallback } from '.'

export function getPort() {
  const portPolyfill: Partial<Runtime.Port> = {
    disconnect: () => executeCallback('runtime-connect-disconnect', null),
    onDisconnect: (callback: () => 1) =>
      addCallback('runtime-connect-disconnect', callback),
    onMessage: {
      addListener: (callback: () => 1) =>
        addCallback('runtime-connect-onMessage', callback),
      removeListener: (callback: () => 1) =>
        removeCallback('runtime-connect-onMessage', callback),
    },
    postMessage: (data: any) =>
      sendMessage('browser-API', {
        type: 'runtime-connect-postMessage',
        data,
      }),
  } as any
  const port = objectDeepProxy(portPolyfill, 'browser-polyfill:connect-port', {
    onNull(type, key) {
      switch (type) {
        case 'get':
          return sendMessage('error', {
            type: 'browser-polyfill:connect-port',
            error: `缺少key ${key}`,
          })
        case 'apply':
          return sendMessage('error', {
            type: 'browser-polyfill:connect-port',
            error: `缺少可执行函数`,
          })
      }
    },
  })

  return port
}
