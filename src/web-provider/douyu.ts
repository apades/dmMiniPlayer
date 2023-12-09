import { Barrage, type DanType } from '@root/danmaku'
import DouyuLiveBarrageClient from '@root/danmaku/douyu/liveBarrageClient'
import { sendMessage } from '@root/inject/contentSender'
import { dq, dq1 } from '@root/utils'
import WebProvider from './webProvider'
import type BarrageClient from '@root/core/danmaku/BarrageClient'
import type { Props } from '@root/core/danmaku/BarrageSender'

window.DouyuLiveBarrageClient = DouyuLiveBarrageClient
export default class DouyuLiveProvider extends WebProvider {
  observer: MutationObserver

  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ) {
    const miniPlayer = await super.initMiniPlayer(options)

    // 弹幕相关
    this.miniPlayer.on('PIPClose', () => {
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
    return miniPlayer
  }

  barrageClient = new DouyuLiveBarrageClient()
  onInitBarrageSender(): Omit<Props, 'textInput'> {
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

    return {
      webSendButton: dq1Adv('.ChatSend-button'),
      webTextInput: dq1Adv('.ChatSend-txt') as HTMLInputElement,
    }
  }
}
