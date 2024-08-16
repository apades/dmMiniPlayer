import { DanmakuInitData } from '@root/core/danmaku/DanmakuEngine'

enum BilibiliDanmakuType {
  normal1 = '1',
  normal2 = '2',
  normal3 = '3',
  bottom = '4',
  top = '5',
  reverse = '6',
  advanced = '7',
  code = '8',
  BAS = '9',
}

const IGNORE_TYPES = new Set<string>([
  BilibiliDanmakuType.code,
  BilibiliDanmakuType.BAS,
  BilibiliDanmakuType.reverse,
  BilibiliDanmakuType.advanced,
])

/**
 * bilibili-API 提供的弹幕请求接口
 *
 * @link https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/danmaku/danmaku_xml.md#%E8%8E%B7%E5%8F%96%E5%AE%9E%E6%97%B6%E5%BC%B9%E5%B9%951
 */
export async function getBiliBiliVideoDanmu(
  cid: string
): Promise<DanmakuInitData[]> {
  const xmlText = await fetch(
    `https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`
  ).then((res) => res.text())

  const parser = new DOMParser()

  const doc = parser.parseFromString(xmlText, 'text/xml').documentElement
  console.log('doc', doc)

  const xmlDans = Array.from(doc.querySelectorAll('d'))

  const danmakus: DanmakuInitData[] = []
  xmlDans.forEach((xmlDan) => {
    const attr = xmlDan.getAttribute('p')
    if (!attr) return null

    const [
      startTime,
      danmakuType,
      fontSize,
      color,
      sendTime,
      pool,
      mid,
      dmid,
      shieldLevel,
    ] = attr.split(',')

    if (IGNORE_TYPES.has(danmakuType)) return

    const danmaku: DanmakuInitData = {
      color: '#' + (+color).toString(16).padStart(6, '0'),
      text: xmlDan.textContent || '',
      time: +startTime,
      type:
        (danmakuType == BilibiliDanmakuType.bottom && /* 'bottom' */ 'top') ||
        (danmakuType == BilibiliDanmakuType.top && 'top') ||
        'right',
    }

    danmakus.push(danmaku)
  })

  return danmakus.sort((a, b) => a.time! - b.time!)
}
