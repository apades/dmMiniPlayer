import { WebProvider } from '@root/core/WebProvider'
import { DanmakuInitData } from '@root/core/danmaku/DanmakuEngine/types'
import { getTransColor } from '@root/danmaku/douyu/utils'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import { switchLatest, tryCatch } from '@root/utils'
import { t } from '@root/utils/i18n'
import toast from 'react-hot-toast'

type DouyuVodBarrage = {
  ctt: string
  tl: number // 出现时间(ms)
  col: number
  mid: string
}

type DouyuVodBarrageResp = {
  error: number
  msg?: string
  data?: {
    count: number
    start_time: number
    end_time: number
    list: DouyuVodBarrage[]
  }
}

/** 单次请求返回约500条，最多翻这么多页，防止接口异常时死循环 */
const MAX_PAGES = 400

function getVid() {
  // https://v.douyu.com/show/ERALvEXwQmxW1Vw0
  const m = location.pathname.match(/\/show\/([^/?#]+)/)
  return m?.[1] ?? ''
}

async function fetchAllBarrage(vid: string): Promise<DanmakuInitData[]> {
  const result: DanmakuInitData[] = []
  const seen = new Set<string>()
  let startTime = 0
  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await fetch(
      `https://v.douyu.com/wgapi/vod/center/getBarrageList?vid=${vid}&start_time=${startTime}&end_time=-1`,
      { credentials: 'include' },
    )
    const json = (await res.json()) as DouyuVodBarrageResp
    if (json.error !== 0) throw Error(`douyu vod barrage error: ${json.msg}`)
    const list = json.data?.list ?? []
    if (!list.length) break

    let added = 0
    for (const d of list) {
      if (seen.has(d.mid)) continue
      seen.add(d.mid)
      added++
      result.push({
        id: d.mid,
        text: d.ctt,
        time: d.tl / 1000,
        color: getTransColor(d.col) ?? '#fff',
        type: 'right',
      })
    }

    if (!added) break

    // 实测：start_time 是开区间（只返回 tl > start_time），且每页 500 条会在某一秒中间截断。
    // 所以下一页从 end_time 前一秒开始重取，靠 mid 去重补齐被截断那一秒的弹幕。
    const endTime = json.data!.end_time
    const next = endTime - 1000
    startTime = next > startTime ? next : endTime
  }
  return result
}

export default class DouyuVideoProvider extends WebProvider {
  private lastVid = ''

  override async onPlayerInitd() {
    this.initDanmakus()
    this.addOnUnloadFn(onRouteChange(() => this.initDanmakus()))
  }

  getDanmakus = switchLatest(async (vid: string) => fetchAllBarrage(vid))

  async initDanmakus() {
    const vid = getVid()
    if (!vid || vid === this.lastVid) return
    this.lastVid = vid

    const [err, danmakus] = await tryCatch(() => this.getDanmakus(vid))
    if (err) {
      console.error(err)
      this.lastVid = ''
      toast.error(t('error.danmakuLoad'))
      return
    }
    this.danmakuEngine?.setDanmakus(danmakus)
  }
}
