import configStore from '@root/store/config'
import { createElement } from '@root/utils'
import { makeAutoObservable } from 'mobx'
import styleUrl from 'url:./DocMiniPlayer.less'
import BarrageSender, {
  type Props as BarrageSenderProps,
} from '../danmaku/BarrageSender'
import MiniPlayer from '../miniPlayer'

export default class BaseDocMiniPlayer extends MiniPlayer {
  pipWindow: Window

  hasInit = false

  styleEl = createElement('link', {
    rel: 'stylesheet',
    href: styleUrl,
  })

  videoPlayer: HTMLElement
  sender: BarrageSender
  vpMobxOption = makeAutoObservable({ canSendBarrage: false })

  /**canvas的captureStream */
  private _webPlayerVideoStream: MediaStream
  get webPlayerVideoStream() {
    if (!this._webPlayerVideoStream)
      this._webPlayerVideoStream = (
        this.webPlayerVideoEl as any
      ).captureStream()
    return this._webPlayerVideoStream
  }

  async iniDocumentPIP() {
    let pipWindow = await window.documentPictureInPicture.requestWindow({
      width: this.canvas.width,
      height: this.canvas.height,
    })
    this.pipWindow = pipWindow

    return pipWindow
  }

  initBarrageSender(props: Omit<BarrageSenderProps, 'textInput'>) {
    if (!configStore.useDocPIP) return
    const playerInput = this.videoPlayer.querySelector<HTMLInputElement>(
      '.barrage-input input'
    )
    this.sender = new BarrageSender({
      ...props,
      textInput: playerInput,
    })
    playerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this.sender.send()
      }
    })

    this.vpMobxOption.canSendBarrage = true
  }

  async test_captureVideo() {
    this.videoPlayer = createElement('video', {
      srcObject: this.webPlayerVideoStream,
      muted: true,
      autoplay: true,
      style: 'position:fixed;right:0;top:0;z-index:999',
      width: '500',
    })
    document.body.appendChild(this.videoPlayer)
  }

  appendCanvasToBody() {
    ;(this.canvas as any).style =
      'position:fixed;z-index:1000;top:0;left:0;visibility: hidden;'
    document.body.appendChild(this.canvas)
  }
}
