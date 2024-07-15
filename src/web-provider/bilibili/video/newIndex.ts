import { WebProvider } from '@root/core/WebProvider'
import { getDanmakus, getVideoInfoFromUrl } from '../utils'
import BilibiliSubtitleManager from './SubtitleManager'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { dq1 } from '@root/utils'

export default class NewBilibiliVideoProvider extends WebProvider {
  onInit(): void {
    this.subtitleManager = new BilibiliSubtitleManager()
    this.danmakuSender = new DanmakuSender()

    this.danmakuSender.setData({
      webTextInput: dq1<HTMLInputElement>('.bpx-player-dm-input'),
      webSendButton: dq1<HTMLElement>('.bpx-player-dm-btn-send'),
    })
  }

  async onPlayerInitd() {
    this.initDanmakus()

    this.addOnUnloadFn(
      onRouteChange(() => {
        this.initDanmakus()
        this.subtitleManager.init(this.webVideo)
      })
    )
  }

  async initDanmakus() {
    const { aid, cid } = await getVideoInfoFromUrl(location.href)
    const danmakus = await getDanmakus(aid, cid)

    this.danmakuEngine?.setDanmakus(danmakus)
  }
}
