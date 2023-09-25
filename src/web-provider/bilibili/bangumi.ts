import type { DanType } from '@root/danmaku'
import BilibiliVideoProvider from './video'
import { getBiliBiliVideoDanmu } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-api'
import configStore from '@root/store/config'

export default class BiliBiliBangumiProvider extends BilibiliVideoProvider {
  async getBangumiInfo(
    id: string,
    isEp: boolean
  ): Promise<{ aid: any; cid: any }> {
    const res = await fetch(
      `https://api.bilibili.com/pgc/view/web/season?${
        isEp ? 'ep_id' : 'season_id'
      }=${id}`,
      {
        credentials: 'include',
      }
    ).then((res) => res.json())

    const tarId = isEp ? id : res.result.user_status.progress.last_ep_id
    const findEp = res.result.episodes.find((ep: any) => ep.id == tarId)

    return { aid: findEp.aid, cid: findEp.cid }
  }
  async getDans(): Promise<DanType[]> {
    const match = location.pathname.match(/\/(ss|ep)(\d+)/)
    const id = match?.[2],
      isEp = match?.[1] == 'ep'

    const { aid, cid } = await this.getBangumiInfo(id, isEp)

    if (configStore.biliVideoDansFromBiliEvaolved) {
      let danmuContent = await this.getDamuContent(
        aid,
        cid,
        configStore.biliVideoPakkuFilter ? 'ass' : 'originJson'
      )

      if (configStore.biliVideoPakkuFilter) {
        return this.transAssContentToDans(danmuContent)
      } else {
        return this.transJsonContentToDans(danmuContent)
      }
    } else {
      return getBiliBiliVideoDanmu(cid)
    }
  }
}
