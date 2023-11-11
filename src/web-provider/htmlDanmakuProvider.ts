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
}
