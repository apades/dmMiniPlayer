import { getVideoInfoFromUrl } from '@pkgs/danmakuGetter/apiDanmaku/bilibili/BilibiliVideo'
import type { SubtitleItem } from '@root/core/SubtitleManager/types'
import type { DanmakuInitData } from '@root/core/danmaku/DanmakuEngine'
import { getBiliBiliVideoDanmu } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-api'
import { DanmakuStack } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-evaolved/converter/danmaku-stack'
import type { DanmakuType } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-evaolved/converter/danmaku-type'
import {
  type JsonDanmaku,
  getTextByType,
} from '@root/danmaku/bilibili/videoBarrageClient/bilibili-evaolved/download/utils'
import configStore from '@root/store/config'
import { onceCall, wait } from '@root/utils'
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
export const getSubtitles = async (
  url = location.href,
): Promise<SubtitleItem[]> => {
  const { aid, cid } = await getVideoInfoFromUrl(url)
  const infoData = await fetch(
    `https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`,
    {
      credentials: 'include',
    },
  )
    .then((res) => res.json())
    .then((res) => res.data)

  const subtitles = infoData.subtitle?.subtitles ?? []
  console.log('subtitles', subtitles)
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
  }
  // 走bili-evaolved的
  const danmuContent = await getTextByType(
    configStore.biliVideoPakkuFilter ? 'ass' : 'originJson',
    { aid, cid },
  )

  if (configStore.biliVideoPakkuFilter) {
    return new AssParser(danmuContent).dans
  }
  const jsonArr = JSON.parse(danmuContent) as JsonDanmaku['jsonDanmakus']
  return jsonArr.map((d) => {
    const type = DanmakuStack.danmakuType[d.mode as DanmakuType]

    return {
      color: '#' + d.color.toString(16),
      text: d.content,
      time: d.progress ? d.progress / 1000 : 0,
      type: type === 'top' ? 'top' : 'right',
    } as DanmakuInitData
  })
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
