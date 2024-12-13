import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { WebProvider } from '@root/core/WebProvider'
import DouyuLiveBarrageClient from '@root/danmaku/douyu/liveBarrageClient'
import { sendMessage } from '@root/inject/contentSender'
import { dq1Adv } from '@root/utils'

export default class DouyuLiveProvider extends WebProvider {
  onInit(): void {
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

    this.danmakuSender = new DanmakuSender()
    this.danmakuSender.setData({
      webSendButton: dq1Adv<HTMLElement>('.ChatSend-button'),
      webTextInput: dq1Adv<HTMLInputElement>('.ChatSend-txt'),
    })
  }

  async onPlayerInitd() {
    this.connectDanmakuWs()
  }

  getRoomId() {
    let locationId = location.pathname.split('/').pop() ?? ''
    if (+locationId + '' == locationId) return locationId
    return new URLSearchParams(location.search).get('rid') ?? ''
  }

  danmakuWs?: DouyuLiveBarrageClient
  connectDanmakuWs() {
    this.danmakuWs = new DouyuLiveBarrageClient(this.getRoomId())

    this.addOnUnloadFn(
      this.danmakuWs.on2('danmu', (danmaku) => {
        // console.log('danmu', danmaku)
        this.danmakuEngine?.addDanmakus([
          {
            ...danmaku,
            type: 'right',
          },
        ])
      }),
    )
  }

  onUnload(): void {
    this.danmakuWs?.close()
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
  }
}
