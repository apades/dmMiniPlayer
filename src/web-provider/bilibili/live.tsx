import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { WebProvider } from '@root/core/WebProvider'
import BilibiliLiveBarrageClient from '@root/danmaku/bilibili/liveBarrageClient'
import BilibiliLiveDomBarrageClient from '@root/danmaku/bilibili/liveBarrageClient/domBarrageClient'
import { dq1Adv } from '@root/utils'

export default class BilibiliLiveProvider extends WebProvider {
  override isLive = true
  override onInit(): void {
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender.setData({
      webSendButton:
        dq1Adv<HTMLElement>('.send-danmaku') ||
        dq1Adv<HTMLElement>('.right-actions button') ||
        dq1Adv<HTMLElement>('#chat-control-panel-vm .bottom-actions button'),
      webTextInput:
        dq1Adv<HTMLInputElement>('.chat-input-new textarea') ||
        dq1Adv<HTMLInputElement>('#chat-control-panel-vm textarea') ||
        dq1Adv<HTMLInputElement>('.chat-input textarea'),
    })
  }

  override async onPlayerInitd() {
    this.connectDanmakuWs()
  }

  danmakuWs?: BilibiliLiveBarrageClient
  danmakuDom?: BilibiliLiveDomBarrageClient
  connectDanmakuWs() {
    const id = this.getRoomShortId()

    if (!id) {
      console.warn('[dmMiniPlayer] 未解析到直播间房间号，使用 DOM 弹幕模式')
      this.startDomDanmaku()
      return
    }

    this.danmakuWs = new BilibiliLiveBarrageClient(id)

    this.addOnUnloadFn(
      this.danmakuWs.on2('danmu', (danmaku) => {
        this.addDanmaku(danmaku)
      }),
    )
    this.addOnUnloadFn(
      this.danmakuWs.on2('failed', () => {
        this.startDomDanmaku()
      }),
    )
  }

  /** 从路径中解析房间号（兼容 /123?query、子路径等形式） */
  getRoomShortId(): number {
    const parts = location.pathname.split('/').filter(Boolean)
    for (let i = parts.length - 1; i >= 0; i--) {
      const n = Number(parts[i])
      if (Number.isFinite(n) && n > 0) return n
    }
    return 0
  }

  domStarted = false
  startDomDanmaku() {
    if (this.domStarted) return
    this.domStarted = true
    this.danmakuDom = new BilibiliLiveDomBarrageClient()
    this.addOnUnloadFn(
      this.danmakuDom.on2('danmu', (danmaku) => {
        this.addDanmaku(danmaku)
      }),
    )
  }

  addDanmaku(danmaku: { color: string; text: string; imageMap?: any }) {
    this.danmakuEngine?.addDanmakus([
      {
        ...danmaku,
        type: 'right',
      },
    ])
  }

  override onUnload(): void {
    this.danmakuWs?.close()
    this.danmakuDom?.close()
  }
}
