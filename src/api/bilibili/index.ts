import { MomentType, type BiliLiteItem, type BiliLiveLiteItem } from './type'

const API_bilibili = {
  async getMomentsVideos(
    /**用户的id，好像不用传也行 */
    // uid: string,
    /**传入视频的dynamic_id_str*/
    offset?: string
  ): Promise<BiliLiteItem[]> {
    const url = offset
      ? 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_history'
      : 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new'
    const queryMap = new URLSearchParams()
    // queryMap.set('uid', uid)
    queryMap.set('type_list', [MomentType.Video, MomentType.Bangumi].toString())
    if (offset) {
      queryMap.set('offset_dynamic_id', offset)
    }

    const res = await fetch(url + '?' + queryMap.toString(), {
      credentials: 'include',
    }).then((res) => res.json())

    return res.data.cards.map((card: any) => {
      const cardJsonInfo = JSON.parse(card.card)
      return {
        offset_dynamic_id: card.desc.dynamic_id,
        bid: card.desc.bvid,
        cover: cardJsonInfo.pic,
        title: cardJsonInfo.title,
        user: cardJsonInfo.owner.name,
      } as BiliLiteItem
    })
  },
  async getLiveActiveUsers(): Promise<BiliLiveLiteItem[]> {
    const res = await fetch(
      `https://api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/FeedList?pagesize=99`,
      {
        credentials: 'include',
      }
    ).then((res) => res.json())

    return res.data.list.map((data: any): BiliLiveLiteItem => {
      return {
        cover: data.cover,
        link: data.link,
        roomid: data.roomid,
        title: data.title,
        user: data.uname,
      }
    })
  },
  async getRelateVideos(aid: string) {
    const res = await fetch(
      `https://api.bilibili.com/x/web-interface/wbi/view/detail?aid=${aid}&need_view=1`,
      {
        credentials: 'include',
      }
    ).then((res) => res.json())

    return res?.data?.Related
  },
}

export default API_bilibili
