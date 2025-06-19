import { PlayerEvent } from '@root/core/event'
import { WebProvider } from '@root/core/WebProvider'
import { runCodeInTopWindow } from '@root/inject/contentSender'
import { getPrototypeGetter, getPrototypeSetter } from '@root/utils'

export default class NetflixProvider extends WebProvider {
  onPlayerInitd(): void {
    this.injectWebVideoCurrentTimeSetter(this.webVideo)

    this.on(PlayerEvent.webVideoChanged, (newVideoEl) => {
      this.injectWebVideoCurrentTimeSetter(newVideoEl)
    })
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
