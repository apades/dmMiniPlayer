import type { DanmakuInitData } from '@root/core/danmaku/DanmakuEngine/types'
import { DanmakuGetter } from '../..'

const getBv = (url: URL) =>
  url.pathname
    .split('/')
    .find((p) => /b/i.test(p[0]) && /v/i.test(p[1]))
    .replace(/bv/i, '')
const getPid = (url: URL) => +url.searchParams.get('p') || 1

/**
 * bilibili-API 提供的弹幕请求接口
 *
 * @link https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/danmaku/danmaku_xml.md#%E8%8E%B7%E5%8F%96%E5%AE%9E%E6%97%B6%E5%BC%B9%E5%B9%951
 */
async function getBiliBiliVideoDanmaku(
  cid: string,
  signal: AbortSignal
): Promise<DanmakuInitData[]> {
  const xmlText = await fetch(
    `https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`,
    { signal }
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
        type: (d[1] == '4' && 'bottom') || (d[1] == '5' && 'top') || 'right',
      } as DanmakuInitData
    })
    .sort((a, b) => a.time - b.time)
}

export default class BilibiliVideo extends DanmakuGetter {
  abortController = new AbortController()
  onInit = async () => {
    const signal = this.abortController.signal
    const bv = getBv(this.url),
      pid = getPid(this.url)

    const res = (
      await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bv}`, {
        signal,
      }).then((res) => res.json())
    ).data
    let { aid, cid, pages } = res
    if (pid != 1) {
      try {
        cid = pages[pid - 1].cid
      } catch (error) {
        console.error('出现了pid/pages不存在的问题', res, pid)
      }
    }

    getBiliBiliVideoDanmaku(cid, signal).then((res) => {
      this.emit('addDanmakus', res)
    })
  }
  onUnload = () => {
    this.abortController.abort()
  }
}
