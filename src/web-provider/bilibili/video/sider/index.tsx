import API_bilibili from '@root/api/bilibili'
import VideoPlayerSide, {
  type VideoItem,
} from '@root/components/VideoPlayer/Side'
import type DocMiniPlayer from '@root/core/DocMiniPlayer'
import { useOnce } from '@root/hook'
import { offMessage, onMessage } from '@root/inject/contentSender'
import { dq } from '@root/utils'
import { useState } from 'react'
import type BilibiliVideoProvider from '..'
import { injectorClient } from '@root/inject/client'

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

// ! 问题很大，b站的iframe页面会调用到parent的location.href = ''
// 目前已知可以改parent，但不能改top；如果他用的top.location.href = ''，就是无解(需要proxy parent测试他是否拿到了location)
// 如果上面是parent，还要知道chrome.scripting.executeScript下的frameIds怎么拿到
// ! 已知他用的top，目前没有iframe跳转方案了；需要切换成video url方案了https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/videostream_url.md
export function initSideActionAreaRender(
  miniPlayer: DocMiniPlayer,
  webProvider: BilibiliVideoProvider
) {
  const getCtxDocument = () => document
  /**获取视频分p列表 */
  const getVideoPElList = () => {
    const l1 = dq('.video-episode-card', getCtxDocument())
    if (l1.length) return l1
    // 目前看到瓦的比赛视频分p用的这个
    return dq('.list-box li a', getCtxDocument())
  }
  /**分p视频active */
  const isVideoPActive = (el: HTMLElement) =>
    !!(
      el.querySelector('.video-episode-card__info-playing') ||
      el.querySelector('.video-episode-card__info-title-playing') ||
      el.classList.contains('on')
    )

  function Side() {
    // 视频分p
    const videoPElList = getVideoPElList()
    const videoPItems: VideoItem[] = videoPElList.map((el) => {
      return {
        el,
        link: '',
        linkEl: el,
        title:
          el.querySelector('.video-episode-card__info-title')?.textContent ??
          el.textContent,
        isActive: isVideoPActive(el),
      }
    })

    const [recommendVideos, setRecommendVideos] = useState<RecommendVideo[]>([])

    async function updateRecommendVideos() {
      const relateVideos = await API_bilibili.getRelateVideos(
        await webProvider.getAid()
      )
      const recommendElList = dq('.video-page-card-small')

      if (!relateVideos) throw Error('没法获取关联视频')
      const recommendVideos: RecommendVideo[] = []
      recommendElList.forEach((el) => {
        const elAEl = el.querySelector<HTMLAnchorElement>('.info a'),
          linkEl = elAEl.children[0] as HTMLElement,
          elBvid = elAEl.href.match(/\/video\/(BV.*)\//)?.[1]

        if (!elAEl || !linkEl || !elBvid) return

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

      setRecommendVideos(recommendVideos)
    }

    useOnce(() => {
      console.log('update useOnce')
      updateRecommendVideos()
      const handleLocationChange = (data: any): any => {
        if (data?.event != 'history') return null
        updateRecommendVideos()
      }

      // TODO 替换
      onMessage('inject-api:onTrigger', handleLocationChange)
      window.addEventListener('popstate', handleLocationChange)

      return () => {
        offMessage('inject-api:onTrigger', handleLocationChange)
        window.removeEventListener('popstate', handleLocationChange)
      }
    })

    return (
      <VideoPlayerSide
        videoList={[
          {
            category: '视频分P',
            items: videoPItems,
          },
          {
            category: '推荐视频',
            items: recommendVideos.map((v) => ({ ...v, id: v.bvid })),
          },
        ]}
        webProvider={webProvider}
      />
    )
  }

  miniPlayer.renderSideActionArea = () => <Side />
}
