import { sendMessage } from '@root/inject/contentSender'
import { WebProvider } from '.'
import DanmakuSender, {
  Props as DanmakuSenderProps,
} from '../danmaku/DanmakuSender'
import { dq1 } from '@root/utils'

/**
 * 监听html弹幕的provider，带有工具
 */
export default abstract class HtmlDanmakuProvider extends WebProvider {
  onInit() {
    console.log('HtmlDanmakuProvider')
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender.setData(this.getDanmakuSenderConfig())

    // 注入js
    sendMessage('event-hacker:enable', { qs: 'window', event: 'pagehide' })
    sendMessage('event-hacker:enable', { qs: 'document', event: 'pagehide' })
    sendMessage('event-hacker:enable', {
      qs: 'window',
      event: 'visibilitychange',
    })
    sendMessage('event-hacker:enable', {
      qs: 'document',
      event: 'visibilitychange',
    })

    // 抖音好像是通过interval一直获取document.visibilityState来判断是否要继续在弹幕区里加载弹幕
    function fn() {
      function getDeeperGetter(obj: any, key: string) {
        if (!obj) return undefined
        const val = Object.getOwnPropertyDescriptor(obj, key)
        if (val && val.get) return val.get
        return getDeeperGetter(Object.getPrototypeOf(obj), key)
      }

      try {
        // 还原document的getter
        const originGetter = getDeeperGetter(document, 'visibilityState')
        window.__restoreDocumentVisibilityStateGetter = () => {
          Object.defineProperty(document, 'visibilityState', {
            get: originGetter,
          })
        }
      } catch (error) {
        console.error('没法设置还原document.visibilityState的getter', error)
      }

      try {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get() {
            return 'visible'
          },
        })
      } catch (error) {
        console.error('没法注入document.visibilityState的getter', error)
      }
    }
    sendMessage('run-code', { function: fn.toString() })

    this.startObserveHtmlDanmaku(this.getObserveHtmlDanmakuConfig())
  }

  abstract getObserveHtmlDanmakuConfig(): Parameters<
    (typeof this)['startObserveHtmlDanmaku']
  >[0]

  abstract getDanmakuSenderConfig(): Omit<
    Partial<DanmakuSenderProps>,
    'textInput'
  >

  onUnload() {
    this.stopObserveHtmlDanmaku()
    sendMessage('event-hacker:enable', { qs: 'window', event: 'pagehide' })
    sendMessage('event-hacker:enable', { qs: 'document', event: 'pagehide' })
    sendMessage('event-hacker:enable', {
      qs: 'window',
      event: 'visibilitychange',
    })
    sendMessage('event-hacker:enable', {
      qs: 'document',
      event: 'visibilitychange',
    })

    // 还原document.visibilityState
    function fn() {
      if (window.__restoreDocumentVisibilityStateGetter) {
        window.__restoreDocumentVisibilityStateGetter()
      } else {
        console.error('没有找到window.__restoreDocumentVisibilityStateGetter')
      }
    }
    sendMessage('run-code', { function: fn.toString() })
  }

  htmlDanmakuObserver?: MutationObserver
  /**监听web的弹幕，这个是下策方法 */
  startObserveHtmlDanmaku(props: {
    container: HTMLElement
    child: string
    text: string
    isDanmu?: (child: HTMLElement) => boolean
  }) {
    console.log('startObserveHtmlDanmaku')
    if (!props.container) return
    this.htmlDanmakuObserver = new MutationObserver((list) => {
      const nodes = list.map((l) => [...l.addedNodes]).flat()
      console.log('nodes', list.length, nodes)
      if (!nodes)
        return console.warn('发生了未知的错误，找不到list[0].addedNodes', list)

      nodes.forEach((_node) => {
        const node = _node as HTMLElement

        const isDanmuChild = node.matches(props.child)
        if (!isDanmuChild) return
        const isDanmu = props?.isDanmu?.(node) ?? true
        if (!isDanmu) return
        const text = dq1(props.text, node)?.textContent
        console.log('text', text)
        if (!text) return

        this.danmakuEngine?.addDanmakus([
          {
            text,
            time: this.webVideo.currentTime,
            type: 'right',
            color: '#fff',
          },
        ])
      })
    })
    this.htmlDanmakuObserver.observe(props.container, {
      childList: true,
    })
  }

  stopObserveHtmlDanmaku() {
    this.htmlDanmakuObserver?.disconnect?.()
  }
}
