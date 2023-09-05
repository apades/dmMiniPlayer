import VideoPlayer from '@root/components/VideoPlayer'
import {
  loadLock,
  onVideoPlayerLoad,
} from '@root/components/VideoPlayer/events'
import configStore, { DocPIPRenderType } from '@root/store/config'
import { createElement } from '@root/utils'
import { throttle } from 'lodash-es'
import { makeAutoObservable } from 'mobx'
import { createRoot } from 'react-dom/client'
import styleUrl from 'url:./DocMiniPlayer.less'
import BarrageSender, {
  type Props as BarrageSenderProps,
} from './danmaku/BarrageSender'
import MiniPlayer from './miniPlayer'

export default class DocMiniPlayer extends MiniPlayer {
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

  async startPIPPlay() {
    let pipWindow = await window.documentPictureInPicture.requestWindow({
      width: this.canvas.width,
      height: this.canvas.height,
    })
    this.pipWindow = pipWindow

    console.log('docPIP渲染模式', configStore.docPIP_renderType)
    switch (configStore.docPIP_renderType) {
      case DocPIPRenderType.reactVP_canvasCs: {
        await this.renderCanvasVideoPlayer()
        break
      }
      case DocPIPRenderType.oVP_cs: {
        await this.renderSimpleVideoPlayer()
        break
      }
      case DocPIPRenderType.reactVP_cs: {
        await this.renderReactVideoPlayer()
        break
      }
      case DocPIPRenderType.reactVP_webVideo: {
        // TODO
      }
    }

    this.on('PIPClose', () => {
      loadLock.reWaiting()
    })
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

  /**只使用最简单的canvas 弹幕 + video标签 */
  async renderSimpleVideoPlayer() {
    let pipWindow = this.pipWindow

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
        this.updateCanvasSize({
          height: pipWindow.innerHeight,
          width: pipWindow.innerWidth,
        })
      }, 500)
    )
  }

  /**使用react的videoPlayer，目前可以看到视频帧率明显不高，比canvas还低 */
  async renderReactVideoPlayer() {
    let pipWindow = this.pipWindow
    let re: ReturnType<typeof createRoot>
    if (!this.videoPlayer) {
      this.videoPlayer = createElement('div')
      re = createRoot(this.videoPlayer)
      re.render(
        <VideoPlayer
          index={1}
          srcObject={this.webPlayerVideoStream}
          webVideo={this.webPlayerVideoEl}
          keydownWindow={pipWindow}
          mobxOption={this.vpMobxOption}
        />
      )
    }

    await onVideoPlayerLoad()
    ;(this.canvas as any).style = ''
    pipWindow.document.body.appendChild(this.canvas)
    pipWindow.document.head.appendChild(this.styleEl)
    pipWindow.document.body.appendChild(this.videoPlayer)
    pipWindow.addEventListener('pagehide', () => {
      // ! 这里可能是chrome内部bug，如果不把canvas放到主doc里就关闭PIP，会导致canvas直接出错没法update了
      // ! 而且还有个很严重的问题，不能重复关闭打开(大概2次以上)，否则会出现tab崩溃的情况
      this.appendCanvasToBody()
      this.emit('PIPClose')
      re.unmount()
      this.videoPlayer = null
      //   this.pipWindow = null
    })
    pipWindow.addEventListener(
      'resize',
      throttle(() => {
        console.log('resize', pipWindow.innerWidth)
        this.updateCanvasSize({
          height: pipWindow.innerHeight,
          width: pipWindow.innerWidth,
        })
      }, 500)
    )
  }

  /**使用canvas画的videoStream */
  async renderCanvasVideoPlayer() {
    let pipWindow = this.pipWindow
    let re: ReturnType<typeof createRoot>
    if (!this.videoPlayer) {
      this.videoPlayer = createElement('div')
      re = createRoot(this.videoPlayer)
      re.render(
        <VideoPlayer
          index={1}
          srcObject={this.canvasVideoStream}
          webVideo={this.webPlayerVideoEl}
          keydownWindow={pipWindow}
          mobxOption={this.vpMobxOption}
        />
      )
    }
    console.log('this.videoPlayer1', this.videoPlayer)

    await onVideoPlayerLoad()
    ;(this.canvas as any).style = ''
    pipWindow.document.head.appendChild(this.styleEl)
    pipWindow.document.body.appendChild(this.videoPlayer)
    pipWindow.addEventListener('pagehide', () => {
      // ! 这里可能是chrome内部bug，如果不把canvas放到主doc里就关闭PIP，会导致canvas直接出错没法update了
      // ! 而且还有个很严重的问题，不能重复关闭打开(大概2次以上)，否则会出现tab崩溃的情况
      this.appendCanvasToBody()
      this.emit('PIPClose')
      re.unmount()
      this.videoPlayer = null
      //   this.pipWindow = null
    })
    console.log('this.videoPlayer2', this.videoPlayer)
    pipWindow.addEventListener(
      'resize',
      throttle(() => {
        console.log('resize', pipWindow.innerWidth)
        this.updateCanvasSize({
          height: pipWindow.innerHeight,
          width: pipWindow.innerWidth,
        })
      }, 500)
    )
  }

  canvasUpdate() {
    if (configStore.docPIP_renderType == DocPIPRenderType.reactVP_canvasCs)
      return super.canvasUpdate()

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
    this.animationFrameSignal = requestAnimationFrame(
      this.canvasUpdate.bind(this)
    )
  }

  renderDanmu() {
    if (configStore.docPIP_renderType == DocPIPRenderType.reactVP_canvasCs)
      return super.renderDanmu()

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.danmakuController.draw()
  }

  appendCanvasToBody() {
    // ;(this.canvas as any).style =
    //   'position:fixed;z-index:1000;top:0;left:0;visibility: hidden;'
    // document.body.appendChild(this.canvas)
  }

  async initBarrageSender(props: Omit<BarrageSenderProps, 'textInput'>) {
    if (!configStore.useDocPIP) return
    console.log('videoPlayer', this.videoPlayer)
    try {
      await onVideoPlayerLoad()
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
    } catch (error) {
      console.error('初始化BarrageSender错误', error)
    }
  }
}
