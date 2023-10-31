import VideoPlayer from '@root/components/VideoPlayer'
import configStore from '@root/store/config'
import vpConfig from '@root/store/vpConfig'
import { createElement, throttle } from '@root/utils'
import type { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import styleUrl from 'url:./DocMiniPlayer.less'
import BarrageSender, {
  type Props as BarrageSenderProps,
} from '../danmaku/BarrageSender'
import MiniPlayer from '../miniPlayer'

export default class BaseDocMiniPlayer extends MiniPlayer {
  /**appendChild到pipWindow.body中的htmlEl根 */
  videoPlayerRoot: HTMLElement
  pipWindow: Window
  hasInit = false

  styleEl = createElement('link', {
    rel: 'stylesheet',
    href: styleUrl,
  })
  barrageSender: BarrageSender
  reactRoot: ReturnType<typeof createRoot>

  /**canvas的captureStream */
  private _webPlayerVideoStream: MediaStream
  get webPlayerVideoStream() {
    if (!this._webPlayerVideoStream)
      this._webPlayerVideoStream = (
        this.webPlayerVideoEl as any
      ).captureStream()
    return this._webPlayerVideoStream
  }

  async initReactVP(props: Omit<ComponentProps<typeof VideoPlayer>, 'index'>) {
    this.videoPlayerRoot = createElement('div')
    this.reactRoot = createRoot(this.videoPlayerRoot)
    this.reactRoot.render(
      <VideoPlayer
        index={1}
        keydownWindow={this.pipWindow ?? window}
        {...props}
      />
    )
    return this.reactRoot
  }

  async initDocumentPIP() {
    let pipWindow = await window.documentPictureInPicture.requestWindow({
      width: this.canvas.width,
      height: this.canvas.height,
    })
    this.pipWindow = pipWindow
    pipWindow.addEventListener(
      'resize',
      throttle(() => {
        this.updateCanvasSize()
      }, 500)
    )

    return pipWindow
  }

  initBarrageSender(props: Omit<BarrageSenderProps, 'textInput'>) {
    if (!configStore.useDocPIP) return
    const playerInput = this.videoPlayerRoot.querySelector<HTMLInputElement>(
      '.barrage-input input'
    )
    this.barrageSender = new BarrageSender({
      ...props,
      textInput: playerInput,
    })
    playerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this.barrageSender.send()
      }
    })

    vpConfig.canSendBarrage = true
  }

  async test_captureVideo() {
    this.videoPlayerRoot = createElement('video', {
      srcObject: this.webPlayerVideoStream,
      muted: true,
      autoplay: true,
      style: 'position:fixed;right:0;top:0;z-index:999',
      width: '500',
    })
    document.body.appendChild(this.videoPlayerRoot)
  }

  appendCanvasToBody() {
    ;(this.canvas as any).style =
      'position:fixed;z-index:1000;top:0;left:0;visibility: hidden;'
    document.body.appendChild(this.canvas)
  }
}
