import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { WebProvider } from '@root/core/WebProvider'
import { getDonghuafengDanmu } from '@root/danmaku/donghuafeng'
import { dq1 } from '@root/utils'

export default class DonghuafengProvider extends WebProvider {
  onInit(): void {
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender?.setData({
      webTextInput: dq1<HTMLInputElement>('.danmu-text'),
      webSendButton: dq1<HTMLElement>('.danmu-send_btn'),
    })
  }

  async onPlayerInitd() {
    const id = new URLSearchParams(location.search).get('sn') ?? ''

    this.danmakuEngine?.setDanmakus(await getDonghuafengDanmu(id))
  }
}
