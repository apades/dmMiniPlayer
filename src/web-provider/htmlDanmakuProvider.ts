import { Barrage } from '@root/danmaku'
import { sendMessage } from '@root/inject/contentSender'
import { dq1 } from '@root/utils'
import { windowsOnceCall } from '@root/utils/decorator'
import WebProvider from './webProvider'

export default abstract class HtmlDanmakuProvider extends WebProvider {
  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ) {
    const miniPlayer = await super.initMiniPlayer(options)

    this.miniPlayer.on('PIPClose', () => {
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
    })
    this.injectVisibilityState()
    sendMessage('event-hacker:disable', { qs: 'window', event: 'pagehide' })
    sendMessage('event-hacker:disable', { qs: 'document', event: 'pagehide' })
    sendMessage('event-hacker:disable', {
      qs: 'window',
      event: 'visibilitychange',
    })
    sendMessage('event-hacker:disable', {
      qs: 'document',
      event: 'visibilitychange',
    })
    this.startObserveHtmlDanmaku(this.getObserveHtmlDanmakuConfig())

    miniPlayer.initBarrageSender(this.getBarrageSenderConfig())

    return miniPlayer
  }

  abstract getObserveHtmlDanmakuConfig(): Parameters<
    (typeof this)['startObserveHtmlDanmaku']
  >[0]

  abstract getBarrageSenderConfig(): Parameters<
    (typeof this)['miniPlayer']['initBarrageSender']
  >[0]

  @windowsOnceCall('visibilityState')
  injectVisibilityState() {
    // 抖音好像是通过interval一直获取document.visibilityState来判断是否要继续在弹幕区里加载弹幕
    function fn() {
      Object.defineProperty(document, 'visibilityState', {
        get() {
          return 'visible'
        },
      })
    }
    sendMessage('run-code', { function: fn.toString() })
  }

  htmlDanmakuObserver: MutationObserver
  /**监听web的弹幕，这个是下策方法 */
  startObserveHtmlDanmaku(props: {
    container: HTMLElement
    child: string
    text: string
    uname: string
    // uid?: string
    isDanmu?: (child: HTMLElement) => boolean
  }) {
    this.htmlDanmakuObserver = new MutationObserver((list) => {
      const nodes = list.map((l) => [...l.addedNodes]).flat()
      console.log('nodes', list.length, nodes)
      if (!nodes)
        return console.warn('发生了未知的错误，找不到list[0].addedNodes', list)

      nodes.forEach((node: HTMLElement) => {
        const isDanmuChild = node.matches(props.child)
        if (!isDanmuChild) return
        const isDanmu = props?.isDanmu?.(node) ?? true
        if (!isDanmu) return
        const text = dq1(props.text, node)?.textContent
        if (!text) return
        const uname = (dq1(props.uname, node)?.textContent ?? '').replace(
            /(:|：)$/,
            ''
          ),
          // TODO 独立uid
          uid = uname

        this.miniPlayer.danmakuController.barrages.push(
          new Barrage({
            player: this.miniPlayer,
            config: {
              color: '#fff',
              text,
              time: this.miniPlayer.webPlayerVideoEl.currentTime,
              type: 'right',
              uid,
              uname,
            },
          })
        )
      })
    })
    this.htmlDanmakuObserver.observe(props.container, {
      childList: true,
    })
  }

  stopObserveHtmlDanmaku() {
    this.htmlDanmakuObserver.disconnect()
  }
}
