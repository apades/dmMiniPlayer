import { sendMessage } from '@root/inject/contentSender'
import { dq1 } from '@root/utils'
import { dq1Parent, isInstanceofHtmlElement } from '@root/utils/dom'
import DanmakuSender, {
  Props as DanmakuSenderProps,
} from '../danmaku/DanmakuSender'
import { PlayerEvent } from '../event'
import { WebProvider } from '.'

/**
 * 监听html弹幕的provider，带有工具
 */
export default abstract class HtmlDanmakuProvider extends WebProvider {
  override onInit() {
    console.log('HtmlDanmakuProvider')
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender.setData(this.getDanmakuSenderConfig())

    // 注入js
    sendMessage('event-hacker:disable', { qs: 'window', event: 'pagehide' })
    sendMessage('event-hacker:disable', {
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

    this.addOnUnloadFn(
      this.on2(PlayerEvent.webVideoChanged, () => {
        setTimeout(() => {
          this.stopObserveHtmlDanmaku()
          this.startObserveHtmlDanmaku(this.getObserveHtmlDanmakuConfig())
        }, 500)
      }),
    )
    this.addOnUnloadFn(
      this.on2(PlayerEvent.videoSrcChanged, () => {
        setTimeout(() => {
          this.stopObserveHtmlDanmaku()
          this.startObserveHtmlDanmaku(this.getObserveHtmlDanmakuConfig())
        }, 500)
      }),
    )
  }

  abstract getObserveHtmlDanmakuConfig(): Parameters<
    (typeof this)['startObserveHtmlDanmaku']
  >[0]

  abstract getDanmakuSenderConfig(): Omit<
    Partial<DanmakuSenderProps>,
    'textInput'
  >

  override onUnload() {
    this.stopObserveHtmlDanmaku()
    sendMessage('event-hacker:enable', { qs: 'window', event: 'pagehide' })
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
    text: string | ((child: HTMLElement) => HTMLElement)
    isDanmu?: (child: HTMLElement) => boolean
  }) {
    if (!props.container) return
    console.log('startObserveHtmlDanmaku')

    const resolveNode = (node: Node) => {
      if (!isInstanceofHtmlElement(node)) return
      if (!node.matches(props.child)) return
      if (!(props?.isDanmu?.(node) ?? true)) return
      const text =
        typeof props.text === 'function'
          ? props.text(node)?.textContent
          : dq1(props.text, node)?.textContent
      if (!text) return

      this.danmakuEngine?.addDanmakus([
        {
          text,
          type: 'right',
          color: '#fff',
        },
      ])
    }

    const observer = new MutationObserver((list) => {
      list.forEach((record) => {
        if (record.type === 'childList') {
          record.addedNodes.forEach((added) => {
            resolveNode(added)
          })
        }
      })
    })
    observer.observe(props.container, {
      childList: true,
    })
    this.htmlDanmakuObserver = observer
  }

  stopObserveHtmlDanmaku() {
    this.htmlDanmakuObserver?.disconnect?.()
    this.htmlDanmakuObserver = undefined
  }
}
