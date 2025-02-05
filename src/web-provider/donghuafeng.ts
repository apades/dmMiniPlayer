import { HtmlDanmakuProvider } from '@root/core/WebProvider'
import { getDonghuafengDanmu } from '@root/danmaku/donghuafeng'

export default class DonghuafengProvider extends HtmlDanmakuProvider {
  async onPlayerInitd() {
    const id = new URLSearchParams(location.search).get('sn') ?? ''

    this.danmakuEngine?.setDanmakus(await getDonghuafengDanmu(id))
  }
}
