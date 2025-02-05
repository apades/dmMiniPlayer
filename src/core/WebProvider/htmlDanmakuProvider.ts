import { sendMessage } from '@root/inject/contentSender'
import { WebProvider } from '.'
import DanmakuSender, {
  Props as DanmakuSenderProps,
} from '../danmaku/DanmakuSender'
import { arrLen, dq1, dq1Adv, onceCall } from '@root/utils'
import configStore from '@root/store/config'

/**
 * 监听html弹幕的provider，带有工具
 */
export default class HtmlDanmakuProvider extends WebProvider {
  initdDanmakuSender = false
  initdDanmakuEngine = false
  onInit() {
    console.log('HtmlDanmakuProvider')
    this.initdDanmakuSender = !!this.initDanmakuSender()
    this.initdDanmakuEngine = !!this.initDanmakuEngine()

    if (this.initdDanmakuEngine) {
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
    }
  }

  private getWebsiteDanmakuSetting = onceCall(() => {
    const { host, pathname } = location
    const pathArr = pathname.split('/')

    let config: (typeof configStore.websiteDanmakuSetting)[string] | null = null
    const hasHostConfig = [
      host,
      ...arrLen(pathname.length).map((_, i) => pathArr.slice(0, -i).join('/')),
    ].find((url) => {
      const existConfig = configStore.websiteDanmakuSetting[url]
      if (!existConfig) return
      config = existConfig
      console.log('[普通]匹配到的设置', existConfig)
      return true
    })

    if (hasHostConfig) return config

    // 正则配置
    const regKeys = Object.keys(configStore.websiteDanmakuSetting)
      .filter((key) => key.startsWith('/') && key.endsWith('/'))
      .map((key) => ({
        regexp: new RegExp(key.match(/^\/(.*)\/$/)?.[1] ?? ''),
        key,
      }))
    // TODO 可能这个脚本运行在iframe里，需要top的location才对
    const url = location.host + location.pathname
    for (const { key, regexp } of regKeys) {
      if (!regexp.test(url)) continue
      const existConfig = configStore.websiteDanmakuSetting[key]
      if (!existConfig) continue
      config = existConfig
      console.log('[正则]匹配到的设置', config, existConfig)
      break
    }
    return config
  })
  private initDanmakuSender() {
    this.danmakuSender = new DanmakuSender()
    let config = this.getDanmakuSenderConfig()

    // 查找弹幕设置
    if (config === null) {
      const settingConfig = this.getWebsiteDanmakuSetting()
      if (!settingConfig) return
      config = {
        webSendButton: settingConfig.sender_button,
        webTextInput: settingConfig.sender_input,
      }
    }
    this.danmakuSender.setData(config)
    return true
  }
  private initDanmakuEngine() {
    let config = this.getObserveHtmlDanmakuConfig()
    // 查找弹幕设置
    if (config === null) {
      const settingConfig = this.getWebsiteDanmakuSetting()
      if (!settingConfig) return
      config = {
        container: dq1Adv(settingConfig.danmaku_container)!,
        child: settingConfig.danmaku_child,
        text: settingConfig.danmaku_text,
      }
    }
    if (!config?.container) return

    this.startObserveHtmlDanmaku(config)
    return true
  }

  getObserveHtmlDanmakuConfig(): Parameters<
    (typeof this)['startObserveHtmlDanmaku']
  >[0] {
    return null as any
  }

  getDanmakuSenderConfig(): Omit<Partial<DanmakuSenderProps>, 'textInput'> {
    return null as any
  }

  onUnload() {
    if (this.initdDanmakuEngine) {
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
