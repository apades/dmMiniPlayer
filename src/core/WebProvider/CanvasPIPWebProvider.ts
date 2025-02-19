import { ERROR_MSG } from '@root/shared/errorMsg'
import { WebProvider } from '.'
import { CanvasVideoPlayer } from '../VideoPlayer/CanvasVideoPlayer'
import { CanvasDanmakuEngine } from '../danmaku/DanmakuEngine'
import { addEventListener, createElement, throttle } from '@root/utils'
import { PlayerEvent } from '../event'

export default class CanvasPIPWebProvider extends WebProvider {
  declare miniPlayer: CanvasVideoPlayer
  protected MiniPlayer = CanvasVideoPlayer

  private pipVideoEl = createElement('video')

  private unlistenPipVideoEl = () => {}
  onOpenPlayer(): Promise<void> | void {
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
      onResize(pipWindow)
      // 这里关闭了应该会自己回收了吧
      pipWindow.addEventListener('resize', () => {
        this.emit(PlayerEvent.resize)
        onResize(pipWindow)
      })
    })
  }
  onPIPClose() {
    this.emit(PlayerEvent.close)
  }

  onUnload() {
    console.log('CanvasPIPWebProvider on unload')
    this.pipVideoEl.srcObject = null
    this.unlistenPipVideoEl()
  }

  close() {
    document.exitPictureInPicture()
  }
}
