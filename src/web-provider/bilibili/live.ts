import { Barrage } from '@root/danmaku'
import BilibiliLiveBarrageClient from '@root/danmaku/bilibili/liveBarrageClient'
import configStore, { DocPIPRenderType } from '@root/store/config'
import { dq, dq1, onWindowLoad } from '@root/utils'
import WebProvider from '../webProvider'
import { getMiniPlayer } from '@root/core'
import { runInAction } from 'mobx'

window.BilibiliLiveBarrageClient = BilibiliLiveBarrageClient
export default class BilibiliLiveProvider extends WebProvider {
  observer: MutationObserver
  barrageClient: BilibiliLiveBarrageClient

  constructor() {
    super()

    // b站的字体
    configStore.fontFamily =
      'SimHei, "Microsoft JhengHei", Arial, Helvetica, sans-serif'
  }

  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ) {
    // b站的iframe video会锁住，需要换模式
    if (options.videoEl.ownerDocument != document) {
      console.warn(
        'b站的iframe videoEl有自己的监听守护，没法把videoEl提取出来，临时切换reactVP_canvasCs模式'
      )
      runInAction(() => {
        configStore.docPIP_renderType = DocPIPRenderType.reactVP_canvasCs
      })
    }
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
      webSendButton: dq1Adv('#chat-control-panel-vm .bottom-actions button'),
      webTextInput: dq1Adv(
        '#chat-control-panel-vm textarea'
      ) as HTMLInputElement,
    })

    return miniPlayer
  }

  private fn: (data: { color: string; text: string }) => void = () => 1
  startObserverWs() {
    this.barrageClient = new BilibiliLiveBarrageClient(
      +location.pathname.split('/').pop()
    )

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
