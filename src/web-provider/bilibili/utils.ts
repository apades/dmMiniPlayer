import type { SubtitleItem } from '@root/core/SubtitleManager/types'

export const getBv = () =>
  location.pathname
    .split('/')
    .find((p) => /b/i.test(p[0]) && /v/i.test(p[1]))
    .replace(/bv/i, '')

export const getPid = () => +new URLSearchParams(location.search).get('p') || 1

type VideoInfo = { aid: string; cid: string; pages: any }
const videoInfoReqCache = new Map<string, Promise<VideoInfo>>()

export async function getVideoInfo(bid: string, pid = 1): Promise<VideoInfo> {
  const cacheKey = `${bid}-${pid}`
  const cache = videoInfoReqCache.get(cacheKey)
  if (cache) return cache

  const request = fetch(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bid}`
  )
    .then((res) => res.json())
    .then((res) => res.data)

  videoInfoReqCache.set(cacheKey, request)

  return request
}

export async function getAid(bid: string, pid = 1): Promise<string> {
  const info = await getVideoInfo(bid, pid)
  return info.aid
}

export async function getCid(bid: string, pid = 1): Promise<string> {
  const info = await getVideoInfo(bid, pid)
  return info.cid
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
  bid = getBv(),
  pid = getPid()
): Promise<SubtitleItem[]> {
  const { aid, cid } = await getVideoInfo(bid, pid)
  const infoData = await fetch(
    `https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`,
    {
      credentials: 'include',
    }
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
