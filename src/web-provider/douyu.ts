import { Barrage } from '@root/danmaku'
import DouyuLiveBarrageClient from '@root/danmaku/douyu/liveBarrageClient'
import configStore, { temporarySetConfigStore } from '@root/store/config'
import { dq, dq1, onWindowLoad } from '@root/utils'
import WebProvider from './webProvider'
import { getMiniPlayer } from '@root/core'
import { injectorClient } from '@root/inject/client'

window.DouyuLiveBarrageClient = DouyuLiveBarrageClient
export default class DouyuLiveProvider extends WebProvider {
  observer: MutationObserver
  barrageClient: DouyuLiveBarrageClient

  constructor() {
    super()

    // 斗鱼的字体
    temporarySetConfigStore(
      'fontFamily',
      'Segoe UI Emoji,SimHei,Microsoft JhengHei,Arial,Helvetica,sans-serif'
    )
  }

  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ) {
    const miniPlayer = await super.initMiniPlayer(options)

    // 弹幕相关
    this.miniPlayer.on('PIPClose', () => {
      this.stopObserveWs()
      injectorClient.domEvents.enableEvent('window', 'pagehide')
      injectorClient.domEvents.enableEvent('document', 'pagehide')
      injectorClient.domEvents.enableEvent('window', 'visibilitychange')
      injectorClient.domEvents.enableEvent('document', 'visibilitychange')
    })
    this.startObserverWs()
    injectorClient.domEvents.disableEvent('window', 'pagehide')
    injectorClient.domEvents.disableEvent('document', 'pagehide')
    injectorClient.domEvents.disableEvent('window', 'visibilitychange')
    injectorClient.domEvents.disableEvent('document', 'visibilitychange')

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
