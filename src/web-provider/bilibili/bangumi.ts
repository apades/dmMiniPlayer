import { BilibiliBangumiBarrageClient } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-api'
import BilibiliVideoProvider from './video'

export default class BiliBiliBangumiProvider extends BilibiliVideoProvider {
  barrageClient = new BilibiliBangumiBarrageClient()
}
