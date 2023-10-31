import { onVideoPlayerLoad } from '@root/components/VideoPlayer/events'
import BaseDocMiniPlayer from './Base'

export default class DocMiniPlayer_ReactVP_canvasCs extends BaseDocMiniPlayer {
  async startPIPPlay() {
    const pipWindow = await this.initDocumentPIP()
    const reactRoot = await this.initReactVP({
      srcObject: this.webPlayerVideoStream,
      webVideo: this.webPlayerVideoEl,
    })

    await onVideoPlayerLoad()
    ;(this.canvas as any).style = ''
    pipWindow.document.head.appendChild(this.styleEl)
    pipWindow.document.body.appendChild(this.videoPlayerRoot)
    pipWindow.addEventListener('pagehide', () => {
      // ! 这里可能是chrome内部bug，如果不把canvas放到主doc里就关闭PIP，会导致canvas直接出错没法update了
      // ! 而且还有个很严重的问题，不能重复关闭打开(大概2次以上)，否则会出现tab崩溃的情况
      this.appendCanvasToBody()
      this.emit('PIPClose')
      reactRoot.unmount()
      this.videoPlayerRoot = null
      //   this.pipWindow = null
    })
  }
}
