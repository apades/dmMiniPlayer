import { VideoItem } from '@root/components/VideoPlayer/Side'
import { PlayerComponentsConfig } from '@root/core/player-component'
import { dq, dq1 } from '@root/utils'
import { getVideoInfoFromUrl } from './bilibili-helpers'

async function getRelateVideos(aid: string) {
  const res = await fetch(
    `https://api.bilibili.com/x/web-interface/wbi/view/detail?aid=${aid}&need_view=1`,
    {
      credentials: 'include',
    },
  ).then((res) => res.json())

  return res?.data?.Related
}

type RecommendVideo = {
  el: HTMLElement
  linkEl: HTMLElement
  link: string
  cover: string
  title: string
  user: string
  played: number
  duration: number
  bvid: string
  danmaku: number
}

export const SideSwitcher: PlayerComponentsConfig['SideSwitcher'] = {
  async attach() {
    const getCtxDocument = () => document
    /**获取视频分p列表 */
    const getVideoPElList = () => {
      const list = [
        () => dq('.video-episode-card', getCtxDocument()),
        // https://www.bilibili.com/video/BV1Yh4y1j7ko 用的这个，是不是瓦比赛那套改了不得而知
        () => dq('.list-box li .clickitem', getCtxDocument()),
        // 新网页的选择器
        () =>
          dq('.video-pod__item .simple-base-item:not(.head)', getCtxDocument()),
        // 还有这种😅
        () =>
          dq('.video-pod__item.simple-base-item:not(.head)', getCtxDocument()),
        // 目前看到瓦的比赛视频分p用的这个
        () => dq('.list-box li a', getCtxDocument()),
        // /list/*用的这个
        () => dq('.action-list-item .actionlist-item-inner', getCtxDocument()),
      ]

      return list.find((fn) => fn().length)?.() || []
    }

    /**分p视频active */
    const isVideoPActive = (el: HTMLElement) =>
      !!(
        el.querySelector('.video-episode-card__info-playing') ||
        el.querySelector('.video-episode-card__info-title-playing') ||
        el.classList.contains('on') ||
        el.classList.contains('active') ||
        el.classList.contains('siglep-active')
      )

    // 视频分p
    const videoPElList = getVideoPElList()
    const videoPItems: VideoItem[] = videoPElList.map((el) => {
      return {
        el,
        link: '',
        linkEl: el,
        title:
          el.querySelector('.video-episode-card__info-title')?.textContent ??
          el.querySelector('.title')?.textContent ??
          el.textContent?.trim() ??
          '',
        isActive: isVideoPActive(el),
        cover: dq1<HTMLImageElement>('.cover img', el)?.src,
      }
    })

    async function getRecommendVideos() {
      const relateVideos = await getRelateVideos(
        (await getVideoInfoFromUrl(location.href)).aid,
      )
      const recommendElList = dq('.video-page-card-small')

      if (!relateVideos) throw Error('没法获取关联视频')
      const recommendVideos: RecommendVideo[] = []

      recommendElList.forEach((el) => {
        const elAEl = el.querySelector<HTMLAnchorElement>('.info a')
        if (!elAEl) return

        const linkEl = elAEl.children[0] as HTMLElement,
          elBvid = elAEl.href.match(/\/video\/(BV.*)\//)?.[1]

        if (!linkEl || !elBvid) return

        const i = relateVideos.findIndex((v: any) => v.bvid == elBvid)
        const relate = relateVideos.splice(i, 1)[0]

        recommendVideos.push({
          cover: relate.pic,
          duration: relate.duration,
          // 下面3个对应在网站上的
          el,
          link: `/video/${elBvid}`,
          linkEl,
          played: relate.stat.view,
          title: relate.title,
          user: relate.owner.name,
          bvid: elBvid,
          danmaku: relate.stat.danmaku,
        })
      })

      return recommendVideos
    }

    return [
      {
        items: videoPItems,
        type: 'playList',
      },
      {
        items: (await getRecommendVideos()).map((v) => ({
          ...v,
          id: v.bvid,
        })),
        type: 'recommendedList',
      },
    ]
  },
}
