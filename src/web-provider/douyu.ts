import { Barrage } from '@root/danmaku'
import DouyuLiveBarrageClient from '@root/danmaku/douyu/liveBarrageClient'
import configStore from '@root/store/config'
import { dq, dq1, onWindowLoad } from '@root/utils'
import WebProvider from './webProvider'
import { getMiniPlayer } from '@root/core'
import { sendMessage } from '@root/inject/contentSender'
import type { MiniPlayerProps } from '@root/core/miniPlayer'

window.DouyuLiveBarrageClient = DouyuLiveBarrageClient
export default class DouyuLiveProvider extends WebProvider {
  observer: MutationObserver
  barrageClient: DouyuLiveBarrageClient

  constructor() {
    super()
  }

  protected async initMiniPlayer(options?: MiniPlayerProps) {
    const miniPlayer = await super.initMiniPlayer(options)

    // 弹幕相关
    this.miniPlayer.on('PIPClose', () => {
      this.stopObserveWs()
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
    this.startObserverWs()
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

    function dq1Adv(q: string) {
      const top = dq1(q)
      if (top) {
        return top
      }
      for (const iframe of dq('iframe')) {
        try {
          const child = iframe.contentWindow.document.querySelector(q)
          if (child) return child as HTMLElement
        } catch (error) {}
      }
    }

    this.miniPlayer.initBarrageSender({
      webSendButton: dq1Adv('.ChatSend-button'),
      webTextInput: dq1Adv('.ChatSend-txt') as HTMLInputElement,
    })

    return miniPlayer
  }

  private fn: (data: { color: string; text: string }) => void = () => 1

  getRoomId() {
    let locationId = location.pathname.split('/').pop()
    if (+locationId + '' == locationId) return locationId
    return new URLSearchParams(location.search).get('rid')
  }
  startObserverWs() {
    this.barrageClient = new DouyuLiveBarrageClient(this.getRoomId())

    this.fn = (data: { color: string; text: string }) => {
      this.miniPlayer.danmakuController.barrages.push(
        new Barrage({
          player: this.miniPlayer,
          config: {
            // TODO
            color: data.color,
            text: data.text,
            time: this.miniPlayer.webPlayerVideoEl.currentTime,
            // TODO
            type: 'right',
          },
        })
      )
    }
    this.barrageClient.addEventListener('danmu', this.fn)
  }
  stopObserveWs() {
    this.barrageClient.removeListener('danmu', this.fn)
    this.barrageClient.close()
  }
}
