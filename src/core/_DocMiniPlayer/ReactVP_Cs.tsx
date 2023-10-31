import { onVideoPlayerLoad } from '@root/components/VideoPlayer/events'
import configStore from '@root/store/config'
import BaseDocMiniPlayer from './Base'

export default class DocMiniPlayer_ReactVP_Cs extends BaseDocMiniPlayer {
  async startPIPPlay() {
    const pipWindow = await this.initDocumentPIP()
    const reactRoot = await this.initReactVP({
      srcObject: this.webPlayerVideoStream,
      webVideo: this.webPlayerVideoEl,
    })

    await onVideoPlayerLoad()
    ;(this.canvas as any).style = ''
    pipWindow.document.body.appendChild(this.canvas)
    pipWindow.document.head.appendChild(this.styleEl)
    pipWindow.document.body.appendChild(this.videoPlayerRoot)
    pipWindow.addEventListener('pagehide', () => {
      // ! 这里可能是chrome内部bug，如果不把canvas放到主doc里就关闭PIP，会导致canvas直接出错没法update了
      // ! 而且还有个很严重的问题，不能重复关闭打开(大概2次以上)，否则会出现tab崩溃的情况
      this.appendCanvasToBody()
      this.emit('PIPClose')
      reactRoot.unmount()
      this.videoPlayerRoot = null
    })
  }

  canvasUpdate() {
    if (configStore.renderFPS != 0 ? this.checkFPSLimit() : true) {
      if (!this.isPause) {
        this.detectFPS()
        this.renderDanmu()
      }
    }

    if (configStore.performanceInfo) {
      this.renderPerformanceInfo()
    }

    let now = Date.now()
    let offset = now - this.withoutLimitLastUpdateTime
    this.performanceInfoLimit(() => {
      this.withoutLimitAnimaFPS = ~~(1000 / offset)
    })
    this.withoutLimitLastUpdateTime = now

    this.inUpdateFrame = false
    this.animationFrameSignal = requestAnimationFrame(() => this.canvasUpdate())
  }

  renderDanmu() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.danmakuController.draw()
  }
}
