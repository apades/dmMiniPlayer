import { getVideoInfoFromUrl } from '@pkgs/danmakuGetter/apiDanmaku/bilibili/BilibiliVideo'
import { type BiliLiteItem, type BiliLiveLiteItem, MomentType } from './type'
import type { BilibiliFollowApiData, BilibiliFollowData } from './types/follow'

const API_bilibili = {
  async getMomentsVideos(
    /**用户的id，好像不用传也行 */
    // uid: string,
    /**传入视频的dynamic_id_str*/
    offset?: string,
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
      'https://api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/FeedList?pagesize=99',
      {
        credentials: 'include',
      },
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
      },
    ).then((res) => res.json())

    return res?.data?.Related
  },
  async getFollows(
    /**用户id */
    vmid: number,
    page = 1,
    count = 50,
  ) {
    const res = (await fetch(
      `https://api.bilibili.com/x/relation/followings?vmid=${vmid}&order=desc&order_type=attention&gaia_source=main_web&pn=${page}&ps=${count}`,
      {
        credentials: 'include',
      },
    ).then((res) => res.json())) as BilibiliFollowApiData

    return res
  },

  async getSelfMid() {
    try {
      const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
        credentials: 'include',
      }).then((res) => res.json())

      return res.data.mid as number
    } catch (error) {
      console.error(error)
      return undefined
    }
  },

  async getAllFollows(vmid?: number): Promise<BilibiliFollowData[]> {
    const _vmid = vmid ?? (await this.getSelfMid())
    if (!_vmid) {
      // throw Error('需要登录')
      console.error('未登录')
      return []
    }

    const count = 50
    const res = await this.getFollows(_vmid, 1, count)

    const total = res.data.total

    const lastCount = Math.ceil((total - count) / count)

    const lastRes = (
      await Promise.all(
        new Array(lastCount).fill(0).map(async (_, i) => {
          return (await this.getFollows(_vmid, i + 2, count)).data.list
        }),
      )
    ).flat()

    return [...res.data.list, ...lastRes].map((data) => {
      return {
        mid: data.mid,
        name: data.uname,
        avatar: data.face,
      }
    })
  },

  async getVideoShot(url: string) {
    const { aid, cid } = await getVideoInfoFromUrl(url)

    const res = (
      await fetch(
        `https://api.bilibili.com/x/player/videoshot?aid=${aid}&cid=${cid}`,
      ).then((res) => res.json())
    ).data

    const binaryData = await fetch(res.pvdata).then((res) => res.arrayBuffer())
    const uint16Array = new Uint8Array(binaryData)

    const timeNodes: number[] = []
    for (let i = 0; i < uint16Array.length; i += 2) {
      const timeNode = uint16Array[i] * 100 + uint16Array[i + 1]

      timeNodes.push(timeNode)
    }

    // 第一个是0，可以去掉
    timeNodes.shift()

    return {
      images: res.image as string[],
      xCount: res.img_x_len as number,
      yCount: res.img_y_len as number,
      xSize: res.img_x_size as number,
      ySize: res.img_y_size as number,
      timeNodes,
    }
  },
}

export default API_bilibili
