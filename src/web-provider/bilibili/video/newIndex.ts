import { WebProvider } from '@root/core/WebProvider'
import { getDanmakus, getVideoInfoFromUrl } from '../utils'
import BilibiliSubtitleManager from './SubtitleManager'
import onRouteChange from '@root/inject/csUtils/onRouteChange'

export default class NewBilibiliVideoProvider extends WebProvider {
  onInit(): void {
    this.subtitleManager = new BilibiliSubtitleManager()
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

    this.danmakuEngine.setDanmakus(danmakus)
  }
}
