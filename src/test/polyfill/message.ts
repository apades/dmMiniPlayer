// 这里是mac端和web通信的定义
import { cloneDeep } from 'lodash-es'
import _env from './env'

if (_env.platform === 'web') {
  import('./test')
  import('./interface/userBrowserAPIMessageHandler')
}
// if(_env.)

export type MessageContent = {
  type: string
  data?: any
  error?: string
  isResp?: boolean
  to?: {
    tabId: number
  }
  from?: {
    tabId: number
  }
}

export type Category = 'error' | 'browser-API'

export function sendMessage(category: Category, content: MessageContent) {
  try {
    _sendMessage(category, content)
  } catch (error) {
    //
  }
}
window.sendMessage = sendMessage

function _sendMessage(category: string, _content: any) {
  const content = cloneDeep(_content)
  // 这里需要把content带上发送者的信息，
  // src\background\automator\chat.tsx:50 这里的`ender.tab?.id !== targetTab.id`需要tabId
  content.from = {
    tabId: _env.tabId,
  }

  console.log('💬:发送消息 类别:', category, ' content:', _content)
  switch (_env.platform) {
    case 'mac': {
      return window.webkit.messageHandlers.toNative.postMessage({
        title: category,
        content,
      })
    }
    case 'web': {
      try {
        _env.isBG
          ? opener.postMessage({ title: category, content })
          : window.tarBG.postMessage({ title: category, content })
      } catch (error) {
        //
      }
      // const event = new CustomEvent('polyfill-event', { detail: { title: category, content } })
      // window.dispatchEvent(event)
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const messageMap: Record<string, Function[]> = {}
window.messageMap = messageMap
export function onMessage(
  category: string,
  callback: (content: MessageContent) => void,
) {
  messageMap[category] = messageMap[category] || []
  messageMap[category].push(callback)
}

export function offMessage(
  category: string,
  callback: (content: MessageContent) => void,
) {
  if (!messageMap[category]) return
  messageMap[category].splice(
    messageMap[category].findIndex((cb) => cb == callback),
    1,
  )
}

/** 给mac端调用的方法 */
export function dispatchMessage(category: string, content: MessageContent) {
  messageMap[category]?.forEach?.((cb) => cb(content))
}
window.dispatchMessage = dispatchMessage

export function sendMessageWaitResp(
  category: string,
  content: MessageContent,
): Promise<any> {
  try {
    _sendMessage(category, content)

    return new Promise((res, rej) => {
      const handleMessage = (respContent: any) => {
        if (respContent.type === content.type && respContent.isResp) {
          offMessage(category, handleMessage)
          res(respContent.data)
        }
      }
      onMessage(category, handleMessage)
    })
  } catch (error) {
    console.error('error', error)
    return new Promise((res) => res(null))
  }
}
