import { createElement } from '@root/utils'
import { ERROR_MSG } from '@root/shared/errorMsg'
import { CanvasDanmakuEngine } from '../danmaku/DanmakuEngine'
import CanvasDanmakuVideo from '../danmaku/DanmakuEngine/canvasDanmaku/CanvasDanmakuVideo'
import VideoPlayerBase from './VideoPlayerBase'

export class CanvasVideoPlayer extends VideoPlayerBase {
  videoEl?: HTMLVideoElement
  override onInit(): void {
    this.videoEl = createElement('video')

    this.initVideoPlayer()
  }

  override onUnload(): void {
    this.videoEl = undefined
  }

  protected initVideoPlayer() {
    if (!this.videoEl) {
      throw Error(ERROR_MSG.unInitVideoEl)
    }

    if (!this.danmakuEngine) {
      throw Error(ERROR_MSG.unInitDanmakuEngine)
    }

    if (this.danmakuEngine instanceof CanvasDanmakuEngine) {
      console.log('覆盖danmakuEngine onInit')
      this.danmakuEngine.onInit = function (props) {
        this.canvasDanmakuVideo = new CanvasDanmakuVideo({
          danmakuEngine: this,
          videoEl: props.media as HTMLVideoElement,
          fps: this.fps,
          width: this.container.clientWidth,
          height: this.container.clientHeight,
        })

        // 修改canvasDanmakuVideo的drawCanvas，把画视频方法也加上
        this.canvasDanmakuVideo.drawCanvas = function () {
          this.ctx.drawImage(
            this.videoEl,
            this.x,
            this.y,
            this.width,
            this.height,
          )
          if (this.hasSeek) {
            this.danmakuEngine.drawInSeek()
            this.hasSeek = false
          } else {
            this.danmakuEngine.draw()
          }
        }

        this.container.appendChild(this.canvas)
        this.bindEvent()
      }
    }
  }
}
