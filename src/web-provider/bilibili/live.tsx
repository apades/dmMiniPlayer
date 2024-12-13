import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { WebProvider } from '@root/core/WebProvider'
import BilibiliLiveBarrageClient from '@root/danmaku/bilibili/liveBarrageClient'
import { dq1Adv } from '@root/utils'

export default class BilibiliLiveProvider extends WebProvider {
  isLive = true
  onInit(): void {
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender.setData({
      webSendButton:
        dq1Adv<HTMLElement>('.right-actions button') ||
        dq1Adv<HTMLElement>('#chat-control-panel-vm .bottom-actions button'),
      webTextInput:
        dq1Adv<HTMLInputElement>('.chat-input-new textarea') ||
        dq1Adv<HTMLInputElement>('#chat-control-panel-vm textarea'),
    })
  }

  async onPlayerInitd() {
    this.connectDanmakuWs()
  }

  danmakuWs?: BilibiliLiveBarrageClient
  connectDanmakuWs() {
    const id = +(location.pathname.split('/').pop() ?? 0)

    if (!id) {
      throw Error(`不存在的id号 ${id}`)
    }

    this.danmakuWs = new BilibiliLiveBarrageClient(id)

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
  }
}
