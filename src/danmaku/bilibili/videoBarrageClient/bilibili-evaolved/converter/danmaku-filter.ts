import type { JsonDanmaku, getUserDanmakuConfig } from '../download/utils'
import { AssDanmaku } from './ass-danmaku'
import { convertHexColorForDialogue, convertTimeByDuration } from './ass-utils'
import { XmlDanmaku } from './xml-danmaku'
import { normalizeContent } from './xml-utils'

export default class DanmakuFilter {
  static white = 16777215 // Dec color of white danmaku

  constructor(
    public config: Awaited<ReturnType<typeof getUserDanmakuConfig>>,
  ) {}

  filterJsonDanamku(danamkus: JsonDanmaku['jsonDanmakus']) {
    const filterDanmakus = []
    const config = this.config
    for (const danmaku of danamkus) {
      // 跳过设置为屏蔽的弹幕类型
      const isBlockType = config.blockTypes.indexOf(danmaku.mode) !== -1
      const isBlockColor =
        config.blockTypes.indexOf('color') !== -1 &&
        danmaku.color !== DanmakuFilter.white
      if (isBlockType || isBlockColor) {
        continue
      }
      const xmlDanmaku = new XmlDanmaku(
        this.transJsonDanmakuToXmlDanmaku(danmaku),
      )
      // 应用传入的过滤器
      if (config.blockFilter ? !config.blockFilter(xmlDanmaku) : false) {
        continue
      }
      filterDanmakus.push(danmaku)
    }
    return filterDanmakus
  }

  transJsonDanmakuToXmlDanmaku(json: JsonDanmaku['jsonDanmakus'][number]) {
    return {
      content: json.content,
      time: json.progress ? (json.progress / 1000).toString() : '0',
      type: json.mode?.toString() ?? '1',
      fontSize: json.fontsize?.toString() ?? '25',
      color: json.color?.toString() ?? '16777215',
      timeStamp: json.ctime?.toString() ?? '0',
      pool: json.pool?.toString() ?? '0',
      userHash: json.midHash ?? '0',
      rowId: json.idStr ?? '0',
    }
  }
}
