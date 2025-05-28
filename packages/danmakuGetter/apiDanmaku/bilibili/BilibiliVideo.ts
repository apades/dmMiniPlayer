import type { DanmakuInitData } from '@root/core/danmaku/DanmakuEngine/types'
import { getAnyObjToString, onceCallWithMap } from '@root/utils'
import parser from 'node-html-parser'
import { DanmakuGetter } from '../..'

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
async function getBiliBiliVideoDanmu(cid: string): Promise<DanmakuInitData[]> {
  const xmlText = await fetch(
    `https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`,
  ).then((res) => res.text())

  return parserBilibiliDanmuFromXML(xmlText)
}

export function parserBilibiliDanmuFromXML(xmlText: string): DanmakuInitData[] {
  const doc = parser(xmlText)

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
        (danmakuType === BilibiliDanmakuType.bottom && /* 'bottom' */ 'top') ||
        (danmakuType === BilibiliDanmakuType.top && 'top') ||
        'right',
    }

    danmakus.push(danmaku)
  })

  return danmakus.sort((a, b) => a.time! - b.time!)
}

const videoInfoReqCache = new Map<string, any>()
const cacheFetch: (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<any> = async (...args) => {
  const url = args[0].toString()
  if (videoInfoReqCache.has(url)) {
    return videoInfoReqCache.get(url)
  }
  const res = fetch(...args).then((res) => res.json())
  videoInfoReqCache.set(url, res)
  return res
}

const getBidAndAidFromURL = (url: URL) => {
  // /list/* 列表播放模式的bvid在query里
  if (url.searchParams.get('bvid')) {
    return { bid: url.searchParams.get('bvid'), aid: '' }
  }

  const urlPathnameArr = url.pathname.split('/')

  // bid 模式
  const bidParam = urlPathnameArr.find((p) => /^bv/i.test(p[0] + p[1]))
  if (bidParam) {
    return { bid: bidParam.replace(/bv/i, ''), aid: '' }
  }

  // aid 模式
  const aidParam = urlPathnameArr.find((p) => /^av/i.test(p[0] + p[1]))
  if (aidParam) {
    return { bid: '', aid: aidParam.replace(/av/i, '') }
  }

  return { bid: '', aid: '' }
}

export const getVideoInfoFromUrl = onceCallWithMap(async (_url: string) => {
  const url = new URL(_url)
  let cid = ''

  let { aid, bid } = getBidAndAidFromURL(url)

  // 电影、动画，单独的弹幕接口
  if (/\/bangumi\//.test(url.pathname)) {
    const match = url.pathname.match(/\/(ss|ep)(\d+)/)
    const id = match?.[2],
      isEp = match?.[1] === 'ep'

    const res = await fetch(
      `https://api.bilibili.com/pgc/view/web/season?${
        isEp ? 'ep_id' : 'season_id'
      }=${id}`,
      {
        credentials: 'include',
      },
    ).then((res) => res.json())

    const tarId = isEp ? id : res.result.user_status.progress.last_ep_id
    const findEp = res.result.episodes.find((ep: any) => ep.id === tarId)

    aid = findEp.aid
    cid = findEp.cid
    const duration = findEp.duration / 1000

    return {
      aid,
      bid,
      cid,
      duration,
    }
  }

  const pid = +(url.searchParams.get('p') ?? 1)

  const videoInfo = new URL('https://api.bilibili.com/x/web-interface/view')
  if (bid) {
    videoInfo.searchParams.set('bvid', bid)
  } else if (aid) {
    videoInfo.searchParams.set('aid', aid)
  }
  const res = (await cacheFetch(videoInfo.toString())).data
  const { pages } = res
  aid = res.aid
  cid = res.cid

  if (pid !== 1) {
    try {
      cid = pages[pid - 1].cid
    } catch (error) {
      console.error('出现了pid/pages不存在的问题', res, pid)
    }
  }

  if (!cid || !aid) {
    console.error('找不到匹配的类型')
    return {
      aid,
      bid,
      cid,
    }
  }

  return {
    aid,
    bid,
    cid,
  }
})

export default class BilibiliVideo extends DanmakuGetter {
  abortController = new AbortController()
  onInit = async () => {
    try {
      const { aid, cid, duration } = await getVideoInfoFromUrl(
        this.url.toString(),
      )

      const danmakus = await getBiliBiliVideoDanmu(cid)
      this.emit('addDanmakus', danmakus)

      if (duration) {
        this.emit('config', { duration })
      }
    } catch (error: any) {
      console.error(error)
      getAnyObjToString(error) && this.emit('error', getAnyObjToString(error))
    }
  }
  onUnload = () => {
    this.abortController.abort()
  }
}
