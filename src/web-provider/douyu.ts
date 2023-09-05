import { Barrage } from '@root/danmaku'
import DouyuLiveBarrageClient from '@root/danmaku/douyu/liveBarrageClient'
import configStore from '@root/store/config'
import { dq, dq1, onWindowLoad } from '@root/utils'
import WebProvider from './webProvider'
import { getMiniPlayer } from '@root/core'

window.DouyuLiveBarrageClient = DouyuLiveBarrageClient
export default class DouyuLiveProvider extends WebProvider {
  observer: MutationObserver
  barrageClient: DouyuLiveBarrageClient

  constructor() {
    super()

    // 斗鱼的字体
    configStore.fontFamily =
      'Segoe UI Emoji,SimHei,Microsoft JhengHei,Arial,Helvetica,sans-serif'
  }

  // async bindToPIPEvent(): Promise<void> {
  //   await onWindowLoad()
  //   window.addEventListener(
  //     'click',
  //     (e) => {
  //       let target = e.target as HTMLElement
  //       if (target.getAttribute('title') == '开启画中画') {
  //         console.log('画中画')
  //         e.preventDefault()
  //         e.stopImmediatePropagation()
  //         e.stopPropagation()
  //         this.startPIPPlay()
  //       }
  //     },
  //     false
  //   )
  // }
  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ) {
    const miniPlayer = await super.initMiniPlayer(options)

    // 弹幕相关
    this.miniPlayer.on('PIPClose', () => {
      this.stopObserveWs()
    })
    this.startObserverWs()

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

  // web模式没法知道颜色
  startObserveHtmlDanmaku() {
    this.observer = new MutationObserver((list) => {
      let nodes = list?.[0].addedNodes
      if (!nodes)
        return console.warn('发生了未知的错误，找不到list[0].addedNodes', list)

      nodes.forEach((node: HTMLElement) => {
        let isDanmu = node.classList.contains('danmaku-item')
        if (!isDanmu) return
        this.miniPlayer.danmakuController.barrages.push(
          new Barrage({
            player: this.miniPlayer,
            config: {
              color: '#fff',
              text: node.dataset.danmaku,
              time: this.miniPlayer.webPlayerVideoEl.currentTime,
              type: 'right',
            },
          })
        )
      })
    })
    this.observer.observe(dq1('.chat-items'), {
      childList: true,
    })
  }

  stopObserveHtmlDanmaku() {
    this.observer.disconnect()
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
