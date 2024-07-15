import { WebProvider } from '@root/core/WebProvider'
import { getDanmakus, getVideoInfoFromUrl } from '../utils'
import BilibiliSubtitleManager from './SubtitleManager'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { dq, dq1 } from '@root/utils'
import { SideSwitcher } from '@root/core/SideSwitcher'
import { VideoItem } from '@root/components/VideoPlayer/Side'
import API_bilibili from '@root/api/bilibili'

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

export default class NewBilibiliVideoProvider extends WebProvider {
  onInit(): void {
    this.subtitleManager = new BilibiliSubtitleManager()
    // danmakuSender
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender.setData({
      webTextInput: dq1<HTMLInputElement>('.bpx-player-dm-input'),
      webSendButton: dq1<HTMLElement>('.bpx-player-dm-btn-send'),
    })
    // sideSwitcher
    this.sideSwitcher = new SideSwitcher()
  }

  async onPlayerInitd() {
    this.initDanmakus()
    this.initSideSwitcherData()

    this.addOnUnloadFn(
      onRouteChange(() => {
        this.initDanmakus()
        this.subtitleManager.init(this.webVideo)
        this.initSideSwitcherData()
      })
    )
  }

  async initDanmakus() {
    const { aid, cid } = await getVideoInfoFromUrl(location.href)
    const danmakus = await getDanmakus(aid, cid)

    this.danmakuEngine?.setDanmakus(danmakus)
  }

  async initSideSwitcherData() {
    if (!this.sideSwitcher) {
      console.error('已经被unload了', this)
      throw Error('已经被unload了')
    }

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

    // 视频分p
    const videoPElList = getVideoPElList()
    const videoPItems: VideoItem[] = videoPElList.map((el) => {
      return {
        el,
        link: '',
        linkEl: el,
        title:
          el.querySelector('.video-episode-card__info-title')?.textContent ??
          el.textContent?.trim() ??
          '',
        isActive: isVideoPActive(el),
      }
    })

    async function getRecommendVideos() {
      const relateVideos = await API_bilibili.getRelateVideos(
        (
          await getVideoInfoFromUrl(location.href)
        ).aid
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

    this.sideSwitcher.init([
      {
        category: '视频分P',
        items: videoPItems,
      },
      {
        category: '推荐视频',
        items: (await getRecommendVideos()).map((v) => ({ ...v, id: v.bvid })),
      },
    ])
  }
}
