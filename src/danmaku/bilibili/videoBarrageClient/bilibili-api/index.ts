// export default class BiliBiliVideo

import type { DanType } from '@root/danmaku'

/**
 * bilibili-API 提供的弹幕请求接口
 *
 * @link https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/danmaku/danmaku_xml.md#%E8%8E%B7%E5%8F%96%E5%AE%9E%E6%97%B6%E5%BC%B9%E5%B9%951
 */
export async function getBiliBiliVideoDanmu(cid: string): Promise<DanType[]> {
  const xmlText = await fetch(
    `https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`
  ).then((res) => res.text())

  const parser = new DOMParser()

  const doc = parser.parseFromString(xmlText, 'text/xml').documentElement

  const xmlDans = Array.from(doc.querySelectorAll('d'))

  return xmlDans
    .map((xmlDan) => {
      const attr = xmlDan.getAttribute('p')
      const d = attr.split(',')
      return {
        color: '#' + (+d[3]).toString(16),
        text: xmlDan.textContent,
        time: +d[0],
        type:
          (d[1] == '4' && /* 'bottom' */ 'top') ||
          (d[1] == '5' && 'top') ||
          'right',
      } as DanType
    })
    .sort((a, b) => a.time - b.time)
}
