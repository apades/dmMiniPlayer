import { DanmakuInitData } from '@root/core/danmaku/DanmakuEngine'
import type { SubtitleItem } from '@root/core/SubtitleManager/types'
import { getBiliBiliVideoDanmu } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-api'
import { DanmakuStack } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-evaolved/converter/danmaku-stack'
import { DanmakuType } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-evaolved/converter/danmaku-type'
import {
  JsonDanmaku,
  getTextByType,
} from '@root/danmaku/bilibili/videoBarrageClient/bilibili-evaolved/download/utils'
import configStore from '@root/store/config'
import { onceCall } from '@root/utils'
import AssParser from '@root/utils/AssParser'

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

export interface BiliBiliSubtitleRes {
  font_size: number
  font_color: string
  background_alpha: number
  background_color: string
  stroke: string
  body: Body[]
}
interface Body {
  from: number
  to: number
  location: number
  content: string
}
export async function getSubtitles(
  url = location.href,
): Promise<SubtitleItem[]> {
  const { aid, cid } = await getVideoInfoFromUrl(url)
  const infoData = await fetch(
    `https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`,
    {
      credentials: 'include',
    },
  )
    .then((res) => res.json())
    .then((res) => res.data)

  const subtitles = infoData.subtitle?.subtitles ?? []
  return subtitles.map((s: any) => ({
    label: s.lan_doc,
    value: s.subtitle_url,
  }))
}

export function getSubtitle(url: string): Promise<BiliBiliSubtitleRes> {
  return fetch(url).then((res) => res.json())
}

export const getDanmakus = onceCall(async (aid: string, cid: string) => {
  if (!configStore.biliVideoDansFromBiliEvaolved) {
    return getBiliBiliVideoDanmu(cid)
  } else {
    // 走bili-evaolved的
    let danmuContent = await getTextByType(
      configStore.biliVideoPakkuFilter ? 'ass' : 'originJson',
      { aid, cid },
    )

    if (configStore.biliVideoPakkuFilter) {
      return new AssParser(danmuContent).dans
    } else {
      let jsonArr = JSON.parse(danmuContent) as JsonDanmaku['jsonDanmakus']
      return jsonArr.map((d) => {
        let type = DanmakuStack.danmakuType[d.mode as DanmakuType]

        return {
          color: '#' + d.color.toString(16),
          text: d.content,
          time: d.progress ? d.progress / 1000 : 0,
          type: type == 'top' ? 'top' : 'right',
        } as DanmakuInitData
      })
    }
  }
})

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

/**
 * 传入url，自动分析获取弹幕列表
 */
export async function getVideoInfoFromUrl(_url: string) {
  const url = new URL(_url)
  let cid = ''

  let { aid, bid } = getBidAndAidFromURL(url)

  // 电影、动画，单独的弹幕接口
  if (/\/bangumi\//.test(url.pathname)) {
    const match = location.pathname.match(/\/(ss|ep)(\d+)/)
    const id = match?.[2],
      isEp = match?.[1] == 'ep'

    const res = await fetch(
      `https://api.bilibili.com/pgc/view/web/season?${
        isEp ? 'ep_id' : 'season_id'
      }=${id}`,
      {
        credentials: 'include',
      },
    ).then((res) => res.json())

    const tarId = isEp ? id : res.result.user_status.progress.last_ep_id
    const findEp = res.result.episodes.find((ep: any) => ep.id == tarId)

    aid = findEp.aid
    cid = findEp.cid

    return {
      aid,
      bid,
      cid,
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

  if (pid != 1) {
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
}
