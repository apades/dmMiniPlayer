// export default class BiliBiliVideo

import { VideoBarrageClient } from '@root/core/danmaku/BarrageClient'
import type { DanType } from '@root/danmaku'
import { isUndefined, onceCall } from '@root/utils'
import type { OrPromise } from '@root/utils/typeUtils'

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
        type: (d[1] == '4' && 'bottom') || (d[1] == '5' && 'top') || 'right',
        uid: d[6],
        uname: d[6],
      } as DanType
    })
    .sort((a, b) => a.time - b.time)
}

export class BilibiliVideoBarrageClient extends VideoBarrageClient {
  protected async onInit() {
    const danmakus = await getBiliBiliVideoDanmu(await this.getCid())
    this.emit('allDanmaku', danmakus)
  }

  getBVid() {
    return location.pathname
      .split('/')
      .find((p) => /b/i.test(p[0]) && /v/i.test(p[1]))
      .replace(/bv/i, '')
  }
  getPid() {
    return +new URLSearchParams(location.search).get('p') || 1
  }

  getVideoInfo = onceCall(async (BVid = this.getBVid()) => {
    const res = (
      await fetch(
        `https://api.bilibili.com/x/web-interface/view?bvid=${BVid}`
      ).then((res) => res.json())
    ).data

    return res as {
      aid: string
      cid: string
      pages: { [key: string]: any; cid: string }[]
    }
  })

  async getCid(pid = this.getPid()) {
    const BVid = this.getBVid()

    const res = await this.getVideoInfo(BVid)
    if (pid != 1) {
      try {
        return res.pages[pid - 1].cid
      } catch (error) {
        console.error('出现了pid/pages不存在的问题', res, pid)
      }
    }
    return res.cid
  }

  async getAid() {
    const BVid = this.getBVid()
    const res = await this.getVideoInfo(BVid)
    return res.aid
  }
}

export class BilibiliBangumiBarrageClient extends BilibiliVideoBarrageClient {
  getBangumiInfo = onceCall(async (ssid?: string, isEp?: boolean) => {
    if (isUndefined(ssid) && isUndefined(isEp)) {
      const data = this.getVideoIdInfo()
      ssid = data.ssid
      isEp = data.isEp
    }
    const res = await fetch(
      `https://api.bilibili.com/pgc/view/web/season?${
        isEp ? 'ep_id' : 'season_id'
      }=${ssid}`,
      {
        credentials: 'include',
      }
    ).then((res) => res.json())

    const tarId = isEp ? ssid : res.result.user_status.progress.last_ep_id
    const findEp = res.result.episodes.find((ep: any) => ep.id == tarId)

    return { aid: findEp.aid, cid: findEp.cid }
  })

  getVideoIdInfo() {
    const match = location.pathname.match(/\/(ss|ep)(\d+)/)
    const id = match?.[2],
      isEp = match?.[1] == 'ep'
    return { ssid: id, isEp }
  }

  async getCid() {
    const res = await this.getBangumiInfo()
    return res.cid
  }

  async getAid() {
    const res = await this.getBangumiInfo()
    return res.aid
  }
}
