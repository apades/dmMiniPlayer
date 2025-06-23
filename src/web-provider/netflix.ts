import { VideoItem } from '@root/components/VideoPlayer/Side'
import { PlayerEvent } from '@root/core/event'
import { SideSwitcher } from '@root/core/SideSwitcher'
import SubtitleManager from '@root/core/SubtitleManager'
import srtParser from '@root/core/SubtitleManager/subtitleParser/srt'
import { SubtitleRow } from '@root/core/SubtitleManager/types'
import { WebProvider } from '@root/core/WebProvider'
import { runCodeInTopWindow } from '@root/inject/contentSender'
import {
  createElement,
  getPrototypeGetter,
  getPrototypeSetter,
} from '@root/utils'
import { t } from '@root/utils/i18n'
import { runInAction } from 'mobx'

class NetflixSubtitle extends SubtitleManager {
  async onInit() {
    const list = await runCodeInTopWindow(() => {
      const sid = window.netflix.appContext.state.playerApp
        .getAPI()
        .videoPlayer.getAllPlayerSessionIds()[0]
      const vp = window.netflix.appContext.state.playerApp
        .getAPI()
        .videoPlayer.getVideoPlayerBySessionId(sid)

      return vp
        .getTimedTextTrackList()
        .filter((v: any) => !v.isNoneTrack)
        .map((track: any) => {
          const isCC = track.trackType === 'ASSISTIVE'

          return {
            label: `${track.displayName}${isCC ? ' (CC)' : ''}`,
            value: `${track.bcp47}${isCC ? '[cc]' : ''}`,
          }
        })
    })

    await runInAction(() => {
      this.subtitleItems.length = 0
      this.subtitleItems = list
    })
  }

  async loadSubtitle(value: string): Promise<SubtitleRow[]> {
    const id = getWatchId()
    if (!id) throw 'not found id'
    const url = await runCodeInTopWindow(
      (id, val) => {
        const WEBVTT = 'webvtt-lssdh-ios8'
        const data =
          window.subCache?.[id]?.[val]?.[WEBVTT] ||
          window.subCache?.[id]?.[val + '-forced']?.[WEBVTT]

        if (!data) return
        return data?.[0]?.[0]
      },
      [id, value] as const,
    )

    if (!url) throw 'not found url'
    const vttText = await fetch(url).then((res) => res.text())
    const subtitle = srtParser(vttText)

    return subtitle.map((v) => ({
      ...v,
      text: v.text.replace(/[\r\n]+/g, '\n'),
    }))
  }
}

const getWatchId = () => location.href.match(/watch\/(\d+)/)?.[1]

type First<T extends any[]> = T[0]

export default class NetflixProvider extends WebProvider {
  onInit(): void {
    this.subtitleManager = new NetflixSubtitle()
    this.sideSwitcher = new SideSwitcher()
  }

  onPlayerInitd(): void {
    this.injectWebVideoCurrentTimeSetter(this.webVideo)

    this.on(PlayerEvent.webVideoChanged, (newVideoEl) => {
      this.injectWebVideoCurrentTimeSetter(newVideoEl)
    })

    this.update()
    this.addOnUnloadFn(
      this.on2('webVideoChanged', () => {
        this.update()
      }),
    )
  }

  async update() {
    await this.subtitleManager.init(this.webVideo)
    await this.updateVideoDurationData()
    this.initSideData()
  }

  async updateVideoDurationData() {
    const duration = await runCodeInTopWindow(() => {
      const sid = window.netflix.appContext.state.playerApp
        .getAPI()
        .videoPlayer.getAllPlayerSessionIds()[0]
      const vp = window.netflix.appContext.state.playerApp
        .getAPI()
        .videoPlayer.getVideoPlayerBySessionId(sid)

      return vp.getDuration() / 1000
    })

    Object.defineProperty(this.webVideo, 'duration', {
      get: () => duration,
      set: () => {},
    })
    this.webVideo.dispatchEvent(new Event('durationchange'))
  }

  async runWithAPI<T, Arg extends any[]>(
    ...[cb, args]: Arg extends Array<any>
      ? First<Arg> extends never
        ? [(api: any) => T]
        : [(api: any, arg: Arg) => T, Arg]
      : [(api: any) => T]
  ): Promise<T> {
    return (runCodeInTopWindow as any)(
      (cb: any, args: any) => {
        let fn = new Function(`return (${cb})(...arguments)`)

        const root = document.querySelector('.watch-video')
        if (!root) return
        const apiKey = Object.keys(root).find((key) =>
          key.startsWith('__reactFiber'),
        )
        if (!apiKey) return
        function findTarget(node: any) {
          if (!node) return
          if (node?.stateNode?.handleSelectorEpisodePlay) return node.stateNode
          return findTarget(node?.return)
        }
        const api = findTarget((root as any)[apiKey])

        if (!api) return

        return fn(api, args)
      },
      [cb.toString(), args],
    )
  }
  async initSideData() {
    if (!this.sideSwitcher) return

    const episodicData = await this.runWithAPI((api: any) => {
      const data = api.getEpisodicData()
      return data
    })
    console.log('episodicData', episodicData)
    if (!episodicData) return

    const nowId = getWatchId()
    const showSeason = episodicData.seasons.length > 1
    this.sideSwitcher.init([
      {
        category: t('vp.playList'),
        items: episodicData.seasons
          .map((season: any, si: number) => {
            const episodes = episodicData.episodes[season.id]

            return episodes.map((ep: any, i: number) => {
              return {
                linkEl: createElement('div', {
                  onclick: () => {
                    this.runWithAPI(
                      (api, [epID]) => {
                        api.handleSelectorEpisodePlay(
                          {
                            stopPropagation: () => {},
                          },
                          epID,
                        )
                      },
                      [ep.id],
                    )
                  },
                }),
                title: `${showSeason ? `S${si + 1}/` : ''}${i + 1} ${ep.title}`,
                isActive: ep.id + '' === nowId,
              } as VideoItem
            })
          })
          .flat(),
        mainList: true,
      },
    ])
  }

  // 这是在cs里运行的，无关top的setter
  injectWebVideoCurrentTimeSetter(webVideo: HTMLVideoElement): void {
    if (webVideo.dataset.initd) return

    const getter = getPrototypeGetter(webVideo, 'currentTime')!

    Object.defineProperty(webVideo, 'currentTime', {
      get: getter,
      set: (time: number) => {
        // setter.call(webVideo, time)
        runCodeInTopWindow(
          (time) => {
            const sid = window.netflix.appContext.state.playerApp
              .getAPI()
              .videoPlayer.getAllPlayerSessionIds()[0]
            const vp = window.netflix.appContext.state.playerApp
              .getAPI()
              .videoPlayer.getVideoPlayerBySessionId(sid)

            vp.seek(time * 1000)
          },
          [time],
        )
      },
    })

    webVideo.dataset.initd = '1'
  }
}
