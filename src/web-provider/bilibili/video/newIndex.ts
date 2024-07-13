import MiniPlayer from '@root/core/MiniPlayer/MiniPlayer'
import { WebProvider } from '@root/core/WebProvider'
import { getBiliBiliVideoDanmu } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-api'
import { getBv, getPid, getVideoInfo } from '../utils'

export default class NewBilibiliVideoProvider extends WebProvider {
  protected miniPlayer: MiniPlayer

  onInit() {
    ;(async () => {
      const { aid, cid } = await getVideoInfo(getBv(), getPid())
      const danmakus = await getBiliBiliVideoDanmu(cid)
      this.danmakuEngine.addDanmakus(danmakus)
    })()
  }
}
