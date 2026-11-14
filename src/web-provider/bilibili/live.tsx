import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { HtmlDanmakuProvider } from '@root/core/WebProvider'
import BilibiliLiveBarrageClient from '@root/danmaku/bilibili/liveBarrageClient'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import configStore, { saveConfig, updateConfig } from '@root/store/config'
import { BiliDanmakuMode } from '@root/store/config/specialWebsites'
import { dq1, dq1Adv } from '@root/utils'
import { autorun } from 'mobx'
import { toastBiliDanmakuLoadError } from './danmakuLoadToast'

export default class BilibiliLiveProvider extends HtmlDanmakuProvider {
  override isLive = true
  private htmlModeInited = false

  override onInit(): void {
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender.setData(this.getDanmakuSenderConfig())
  }

  override async onPlayerInitd() {
    this.update()

    this.addOnUnloadFn(
      onRouteChange(() => {
        this.update()
      }),
    )
  }

  private clearUpdateAutorun = () => {}
  update() {
    this.clearUpdateAutorun()
    this.onUnload()

    this.clearUpdateAutorun = autorun(() => {
      this.initDanmakus()
    })
  }

  initDanmakus() {
    this.danmakuWs?.close()
    this.danmakuWs = undefined
    this.stopObserveHtmlDanmaku()

    switch (configStore.biliLiveDanmakuMode) {
      case BiliDanmakuMode.api:
        this.connectDanmakuWs()
        break
      case BiliDanmakuMode.html:
        this.enterHtmlMode()
        break
    }
  }

  danmakuWs?: BilibiliLiveBarrageClient
  connectDanmakuWs() {
    const id = +(location.pathname.split('/').pop() ?? 0)

    if (!id) {
      throw Error(`不存在的id号 ${id}`)
    }

    const danmakuWs = new BilibiliLiveBarrageClient(id)
    this.danmakuWs = danmakuWs

    this.addOnUnloadFn(
      danmakuWs.on2('danmu', (danmaku) => {
        this.danmakuEngine?.addDanmakus([
          {
            ...danmaku,
            type: 'right',
          },
        ])
      }),
    )

    danmakuWs.ready.then(([err]) => {
      if (!err) return
      toastBiliDanmakuLoadError(() => this.switchToHtmlDanmaku())
    })
  }

  private switchToHtmlDanmaku() {
    updateConfig({ biliLiveDanmakuMode: BiliDanmakuMode.html })
    saveConfig()
  }

  private enterHtmlMode() {
    if (!this.htmlModeInited) {
      this.htmlModeInited = true
      super.onInit()
      return
    }
    this.stopObserveHtmlDanmaku()
    this.startObserveHtmlDanmaku(this.getObserveHtmlDanmakuConfig())
  }

  override getObserveHtmlDanmakuConfig(): Parameters<
    (typeof this)['startObserveHtmlDanmaku']
  >[0] {
    const container =
      dq1<HTMLElement>('#chat-history-list .chat-items') ||
      dq1<HTMLElement>('#chat-items')
    return {
      container: container!,
      child: '.chat-item.danmaku-item',
      text: (node) =>
        dq1('.danmaku-content', node) ||
        dq1('.danmaku-item-right', node) ||
        node,
    }
  }

  override getDanmakuSenderConfig() {
    return {
      webSendButton:
        dq1Adv<HTMLElement>('.right-actions button') ||
        dq1Adv<HTMLElement>('#chat-control-panel-vm .send-btn'),
      webTextInput:
        dq1Adv<HTMLInputElement>('.chat-input-new textarea') ||
        dq1Adv<HTMLInputElement>('#chat-control-panel-vm textarea'),
    }
  }

  override onUnload(): void {
    this.danmakuWs?.close()
    this.danmakuWs = undefined
    this.clearUpdateAutorun()
  }
}
