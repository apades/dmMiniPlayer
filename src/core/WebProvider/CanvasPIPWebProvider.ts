import { ERROR_MSG } from '@root/shared/errorMsg'
import { addEventListener, createElement, throttle } from '@root/utils'
import { CanvasVideoPlayer } from '../VideoPlayer/CanvasVideoPlayer'
import { CanvasDanmakuEngine } from '../danmaku/DanmakuEngine'
import { PlayerEvent } from '../event'
import { WebProvider } from '.'

export default class CanvasPIPWebProvider extends WebProvider {
  declare miniPlayer: CanvasVideoPlayer
  protected override MiniPlayer = CanvasVideoPlayer

  private pipVideoEl = createElement('video')

  private unlistenPipVideoEl = () => {}
  override onOpenPlayer(): Promise<void> | void {
    this.pipVideoEl = createElement('video')

    if (!this.danmakuEngine) {
      throw Error(ERROR_MSG.unInitDanmakuEngine)
    }
    this.miniPlayer.init()
    this.danmakuEngine.init({
      media: this.webVideo,
      container: this.webVideo,
    })

    if (this.danmakuEngine instanceof CanvasDanmakuEngine) {
      const stream = this.danmakuEngine.canvasDanmakuVideo?.canvasVideoStream
      if (!stream) {
        throw Error(ERROR_MSG.unInitDanmakuEngine)
      }

      this.pipVideoEl.srcObject = stream
      if (this.pipVideoEl.readyState > 0) {
        this.onVideoLoadedmetadata()
      }
      this.unlistenPipVideoEl = addEventListener(
        this.pipVideoEl,
        (pipVideoEl) => {
          pipVideoEl.addEventListener('loadedmetadata', () => {
            this.onVideoLoadedmetadata()
          })
          pipVideoEl.addEventListener('leavepictureinpicture', () => {
            this.onPIPClose()
          })
        },
      )
    }
  }

  onVideoLoadedmetadata() {
    this.pipVideoEl.play()

    const onResize = throttle((pipWindow: PictureInPictureWindow) => {
      const canvasVideo = (this.danmakuEngine as CanvasDanmakuEngine)
        ?.canvasDanmakuVideo
      if (!canvasVideo) {
        console.warn('canvasVideo已经被移除了，但还是触发了pip resize')
        return
      }

      canvasVideo.updateSize({
        height: pipWindow.height,
        width: pipWindow.width,
      })
    }, 500)

    this.pipVideoEl.requestPictureInPicture().then((pipWindow) => {
      this.bindMediaSession()
      onResize(pipWindow)
      // 这里关闭了应该会自己回收了吧
      pipWindow.addEventListener('resize', () => {
        this.emit(PlayerEvent.resize)
        onResize(pipWindow)
      })
    })
  }
  /**
   * canvas 流(MediaStream)被 Chrome 当作直播，原生画中画不显示暂停/快进按钮。
   * 注册 mediaSession 的 play/pause/seek 后，Chrome 会在小窗里显示这些按钮，转发给网页原视频。
   */
  private unbindMediaSession = () => {}
  private bindMediaSession() {
    const ms = navigator.mediaSession
    if (!ms) return
    const video = this.webVideo
    const pipVideo = this.pipVideoEl
    // Chrome 小窗的播放/暂停按钮跟随小窗视频元素自身的 paused 状态，
    // 所以原视频暂停/播放时要同步小窗视频，否则按钮不会切换
    const syncState = () => {
      ms.playbackState = video.paused ? 'paused' : 'playing'
      if (video.paused && !pipVideo.paused) pipVideo.pause()
      if (!video.paused && pipVideo.paused) pipVideo.play().catch(() => {})
    }
    const seek = (offset: number) => {
      video.currentTime = Math.min(
        video.duration || Infinity,
        Math.max(0, video.currentTime + offset),
      )
    }
    const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => video.play()],
      ['pause', () => video.pause()],
      ['seekbackward', (d) => seek(-(d.seekOffset || 10))],
      ['seekforward', (d) => seek(d.seekOffset || 10)],
      // 画面流被当作直播，Chrome 小窗不显示快进/快退，只显示上一首/下一首，借来做 -10s/+10s
      ['previoustrack', () => seek(-10)],
      ['nexttrack', () => seek(10)],
    ]
    for (const [action, handler] of actions) {
      try {
        ms.setActionHandler(action, handler)
      } catch {
        // 浏览器不支持该 action
      }
    }
    // Chrome 也可能直接切换小窗视频元素，这里反向同步给原视频
    const onPipPause = () => {
      if (!video.paused) video.pause()
    }
    const onPipPlay = () => {
      if (video.paused) video.play()
    }
    pipVideo.addEventListener('pause', onPipPause)
    pipVideo.addEventListener('play', onPipPlay)
    video.addEventListener('play', syncState)
    video.addEventListener('pause', syncState)
    syncState()

    this.unbindMediaSession = () => {
      for (const [action] of actions) {
        try {
          ms.setActionHandler(action, null)
        } catch {
          //
        }
      }
      pipVideo.removeEventListener('pause', onPipPause)
      pipVideo.removeEventListener('play', onPipPlay)
      video.removeEventListener('play', syncState)
      video.removeEventListener('pause', syncState)
    }
  }

  onPIPClose() {
    this.unbindMediaSession()
    this.emit(PlayerEvent.close)
  }

  override onUnload() {
    console.log('CanvasPIPWebProvider on unload')
    this.pipVideoEl.srcObject = null
    this.unlistenPipVideoEl()
  }

  override close() {
    document.exitPictureInPicture()
  }
}
