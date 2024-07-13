import VideoPlayer, {
  type VideoPlayerHandle,
} from '@root/components/VideoPlayer'
import {
  loadLock,
  onVideoPlayerLoad,
} from '@root/components/VideoPlayer/events'
import configStore, {
  DocPIPRenderType,
  videoBorderType,
} from '@root/store/config'
import { createElement, throttle } from '@root/utils'
import { makeAutoObservable } from 'mobx'
import { createRoot } from 'react-dom/client'
import styleUrl from './DocMiniPlayer.less?inline'
import BarrageSender, {
  type Props as BarrageSenderProps,
} from './danmaku/BarrageSender'
import MiniPlayer from './miniPlayer'
import { observeVideoEl } from '@root/utils/observeVideoEl'
import { type ReactElement } from 'react'
import { runInAction } from 'mobx'
import vpConfig from '@root/store/vpConfig'
import { getPIPWindowConfig, setPIPWindowConfig } from '@root/utils/storage'
import tailwindBase from '@root/style/tailwindBase.css?inline'
import tailwind from '@root/style/tailwind.css?inline'
import Browser from 'webextension-polyfill'

export default class DocMiniPlayer extends MiniPlayer {
  pipWindow: Window

  hasInit = false

  styleEl = createElement('style', {
    innerHTML: styleUrl,
  })
  tailwindStyleEl = createElement('div', {
    children: [
      createElement('style', {
        innerHTML: tailwindBase,
      }),
      createElement('style', {
        innerHTML: tailwind,
      }),
    ],
  })

  videoPlayer: HTMLElement
  sender: BarrageSender
  renderSideActionArea = () => null as ReactElement

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
    const pipWindowConfig = await getPIPWindowConfig()
    let width = pipWindowConfig?.width ?? this.canvas.width,
      height = pipWindowConfig?.height ?? this.canvas.height

    console.log('pipWindowConfig', pipWindowConfig)
    // cw / ch = vw / vh
    const vw = this.webPlayerVideoEl.videoWidth,
      vh = this.webPlayerVideoEl.videoHeight

    switch (configStore.videoNoBorder) {
      // cw = vw / vh * ch
      case videoBorderType.height: {
        width = (vw / vh) * height
        break
      }
      // ch = vh / vw * cw
      case videoBorderType.width: {
        height = (vh / vw) * width
        break
      }
    }

    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width,
      height,
    })
    this.pipWindow = pipWindow

    console.log('docPIP渲染模式', configStore.docPIP_renderType)
    switch (configStore.docPIP_renderType) {
      /**只使用最简单的canvas 弹幕 + video标签 */
      case DocPIPRenderType.oVP_cs: {
        await this.render_oVP_cs()
        break
      }
      /**使用canvas画的videoStream */
      case DocPIPRenderType.reactVP_canvasCs:
      /**使用react的videoPlayer，目前可以看到视频帧率明显不高，比canvas还低 */
      case DocPIPRenderType.reactVP_cs:
      /**把web的video插到pip中 */
      case DocPIPRenderType.reactVP_webVideo: {
        await this.renderReactVideoPlayer()
        break
      }
    }

    const danmakuContainer = createElement('div', {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      },
    })
    this.videoPlayer.appendChild(danmakuContainer)
    this.danmakuController.init({
      media: this.webPlayerVideoEl,
      container: danmakuContainer,
    })

    this.updateCanvasSize({
      height: pipWindow.innerHeight,
      width: pipWindow.innerWidth,
    })
    pipWindow.addEventListener(
      'resize',
      throttle(() => {
        this.updateCanvasSize({
          height: pipWindow.innerHeight,
          width: pipWindow.innerWidth,
        })
      }, 500)
    )

    this.on('PIPClose', () => {
      loadLock.reWaiting()
      setPIPWindowConfig({
        width: pipWindow.innerWidth,
        height: pipWindow.innerHeight,
      })
    })
  }

  async renderReactVideoPlayer() {
    const pipWindow = this.pipWindow
    const isWebVideoMode =
        configStore.docPIP_renderType == DocPIPRenderType.reactVP_webVideo,
      isCanvasVideoMode =
        configStore.docPIP_renderType == DocPIPRenderType.reactVP_canvasCs

    let vpRef: VideoPlayerHandle
    this.videoPlayer = createElement('div')
    let re = createRoot(this.videoPlayer)
    re.render(
      <VideoPlayer
        index={1}
        subtitleManager={this.props.subtitleManager}
        webVideo={this.webPlayerVideoEl}
        keydownWindow={pipWindow}
        renderSideActionArea={this.renderSideActionArea()}
        // 差异化传参
        {...((isWebVideoMode && { useWebVideo: true }) ||
          (isCanvasVideoMode && { srcObject: this.canvasVideoStream }) || {
            srcObject: this.webPlayerVideoStream,
          })}
        ref={(ref) => {
          if (!ref) return
          vpRef = ref
          window.vpRef = vpRef
        }}
        // emit事件
        onSeeked={() => this.emit('seek')}
        onPlay={() => this.emit('play')}
        onPause={() => this.emit('pause')}
      />
    )
    const unobserveVideoElChange = observeVideoEl(
      this.webPlayerVideoEl,
      (newVideoEl) => {
        // 只给reactVP_webVideo模式监听
        if (isWebVideoMode) {
          console.log('observeVideoElChange', newVideoEl)
          this.updateWebVideoPlayerEl(newVideoEl)
        }
      }
    )

    // 用来把video元素还原回原本位置的方法
    let restoreWebVideoPlayerElState = () => null as void
    if (isWebVideoMode) {
      restoreWebVideoPlayerElState = this.initWebVideoPlayerElState(
        this.webPlayerVideoEl
      )
    }

    // video标签切换时
    this.updateWebVideoPlayerEl = (videoEl) => {
      super.updateWebVideoPlayerEl(videoEl)
      this.webPlayerVideoEl = videoEl
      console.log('updateWebVideoPlayerEl', videoEl)
      vpRef.updateVideo(videoEl)
      if (isWebVideoMode) {
        // 控制要不要把上一个还原
        restoreWebVideoPlayerElState = this.initWebVideoPlayerElState(videoEl)
      }
    }

    await onVideoPlayerLoad()
    ;(this.canvas as any).style = ''
    //
    if (!isCanvasVideoMode) {
      pipWindow.document.body.appendChild(this.canvas)
    }
    pipWindow.document.head.appendChild(this.styleEl)
    pipWindow.document.head.appendChild(this.tailwindStyleEl)
    pipWindow.document.body.appendChild(this.videoPlayer)
    pipWindow.addEventListener('pagehide', () => {
      // ! 这里可能是chrome内部bug，如果不把canvas放到主doc里就关闭PIP，会导致canvas直接出错没法update了
      // ! 而且还有个很严重的问题，不能重复关闭打开(大概2次以上)，否则会出现tab崩溃的情况
      this.appendCanvasToBody()
      this.emit('PIPClose')
      re.unmount()
      this.videoPlayer = null
      this.updateWebVideoPlayerEl = super.updateWebVideoPlayerEl

      restoreWebVideoPlayerElState()
      unobserveVideoElChange()
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
  async render_oVP_cs() {
    let pipWindow = this.pipWindow

    this.videoPlayer = createElement('video', {
      srcObject: this.webPlayerVideoStream,
      muted: true,
      autoplay: true,
    })
    ;(this.canvas as any).style = ''
    pipWindow.document.body.appendChild(this.canvas)
    pipWindow.document.head.appendChild(this.styleEl)
    pipWindow.document.head.appendChild(this.tailwindStyleEl)
    pipWindow.document.body.appendChild(this.videoPlayer)
    pipWindow.addEventListener('pagehide', () => {
      // ! 这里可能是chrome内部bug，如果不把canvas放到主doc里就关闭PIP，会导致canvas直接出错没法update了
      // ! 而且还有个很严重的问题，不能重复关闭打开(大概2次以上)，否则会出现tab崩溃的情况
      this.appendCanvasToBody()
      this.emit('PIPClose')
      this.videoPlayer = null
      //   this.pipWindow = null
    })
  }

  /**return的函数运行是还原videoEl位置和状态 */
  initWebVideoPlayerElState(videoEl: HTMLVideoElement) {
    const originParent = videoEl.parentElement,
      originInParentIndex = [...videoEl.parentElement.children].findIndex(
        (child) => child == videoEl
      ),
      hasController = videoEl.controls,
      originStyle = videoEl.getAttribute('style')
    videoEl.controls = false

    return () => {
      videoEl.controls = hasController
      if (!originParent.childNodes[originInParentIndex]) {
        originParent.appendChild(videoEl)
      } else {
        originParent.insertBefore(
          videoEl,
          originParent.childNodes[originInParentIndex]
        )
      }
    }
  }

  canvasUpdate(force = false) {
    if (
      [DocPIPRenderType.reactVP_canvasCs].includes(
        configStore.docPIP_renderType
      )
    )
      return super.canvasUpdate(force)

    if (force || (configStore.renderFPS != 0 ? this.checkFPSLimit() : true)) {
      if (force || !this.isPause || !this.hansDraw) {
        this.hansDraw = true
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.detectFPS()
        this.renderDanmu()
        if (configStore.performanceInfo) {
          this.renderPerformanceInfo()
        }
      }
    }
    if (force) return

    let now = Date.now()
    let offset = now - this.withoutLimitLastUpdateTime
    this.performanceInfoLimit(() => {
      this.withoutLimitAnimaFPS = ~~(1000 / offset)
    })
    this.withoutLimitLastUpdateTime = now

    this.inUpdateFrame = false
    this.animationFrameSignal = requestAnimationFrame(() => this.canvasUpdate())
  }

  appendCanvasToBody() {
    // ;(this.canvas as any).style =
    //   'position:fixed;z-index:1000;top:0;left:0;visibility: hidden;'
    // document.body.appendChild(this.canvas)
  }

  async initBarrageSender(props: Omit<BarrageSenderProps, 'textInput'>) {
    if (!configStore.useDocPIP) return
    console.log('初始化BarrageSender')
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

      runInAction(() => {
        vpConfig.canSendBarrage = true
      })
    } catch (error) {
      console.error('初始化BarrageSender错误', error)
    }
  }
}
