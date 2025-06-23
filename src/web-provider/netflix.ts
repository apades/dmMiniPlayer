import { PlayerEvent } from '@root/core/event'
import SubtitleManager from '@root/core/SubtitleManager'
import srtParser from '@root/core/SubtitleManager/subtitleParser/srt'
import { SubtitleRow } from '@root/core/SubtitleManager/types'
import { WebProvider } from '@root/core/WebProvider'
import { runCodeInTopWindow } from '@root/inject/contentSender'
import { getPrototypeGetter, getPrototypeSetter } from '@root/utils'
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

      console.log('netflix change', sid, vp.getTimedTextTrackList())
      const id = location.href.match(/watch\/(\d+)/)?.[1]
      return vp
        .getTimedTextTrackList()
        .filter((v: any) => !v.isForcedNarrative)
        .map((track: any) => {
          const isCC = track.trackType === 'ASSISTIVE'

          return {
            label: track.displayName,
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
    const id = location.href.match(/watch\/(\d+)/)?.[1]
    if (!id) throw 'not found id'
    const url = await runCodeInTopWindow(
      (id, val) => {
        const WEBVTT = 'webvtt-lssdh-ios8'
        const data =
          window.subCache?.[id]?.[val]?.[WEBVTT] ||
          window.subCache?.[id]?.[val + '-forced']?.[WEBVTT]

        console.log('loadSubtitle', data, id, val)
        if (!data) return
        return data?.[0]?.[0]
      },
      [id, value] as const,
    )

    if (!url) throw 'not found url'
    const vttText = await fetch(url).then((res) => res.text())
    const subtitle = srtParser(vttText)

    return subtitle
  }
}

export default class NetflixProvider extends WebProvider {
  onInit(): void {
    this.subtitleManager = new NetflixSubtitle()
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

  update() {
    this.subtitleManager.init(this.webVideo)
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
