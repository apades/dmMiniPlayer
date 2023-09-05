import { createElement } from '@root/utils'
import { throttle } from 'lodash-es'
import BaseDocMiniPlayer from './Base'

export default class DocMiniPlayer_OVP_Cs extends BaseDocMiniPlayer {
  async startPIPPlay() {
    const pipWindow = await this.iniDocumentPIP()
    this.videoPlayer = createElement('video', {
      srcObject: this.webPlayerVideoStream,
      muted: true,
      autoplay: true,
    })
    ;(this.canvas as any).style = ''
    pipWindow.document.body.appendChild(this.canvas)
    pipWindow.document.head.appendChild(this.styleEl)
    pipWindow.document.body.appendChild(this.videoPlayer)
    pipWindow.addEventListener('pagehide', () => {
      // ! 这里可能是chrome内部bug，如果不把canvas放到主doc里就关闭PIP，会导致canvas直接出错没法update了
      // ! 而且还有个很严重的问题，不能重复关闭打开(大概2次以上)，否则会出现tab崩溃的情况
      this.appendCanvasToBody()
      this.emit('PIPClose')
      this.videoPlayer = null
      //   this.pipWindow = null
    })
    pipWindow.addEventListener(
      'resize',
      throttle(() => {
        console.log('resize', pipWindow.innerWidth)
        this.updateCanvasSize()
      }, 500)
    )
  }
}
