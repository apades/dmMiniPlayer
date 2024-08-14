import VideoPlayer /* , { VideoPlayerHandle } */ from '@root/components/VideoPlayer'
import configStore, { DocPIPRenderType } from '@root/store/config'
import { createElement, throttle } from '@root/utils'
import { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import CanvasVideo from '../CanvasVideo'
import { PlayerEvent } from '../event'
import VideoPlayerBase from './VideoPlayerBase'
// style
import tailwind from '@root/style/tailwind.css?inline'
import tailwindBase from '@root/style/tailwindBase.css?inline'
import style from '@root/components/VideoPlayer/index.less?inline'
import VideoPlayerV2, {
  VideoPlayerHandle,
} from '@root/components/VideoPlayerV2'

const styleEl = createElement('div', {
  className: 'style-list',
  children: [tailwindBase, tailwind, style].map((style) =>
    createElement('style', { innerHTML: style })
  ),
})

export class HtmlVideoPlayer extends VideoPlayerBase {
  playerRootEl?: HTMLElement

  onInit(): void {
    this.renderReactVideoPlayer()
    // this.on(PlayerEvent.close, () => {})
  }

  get canvasVideoStream() {
    const canvasVideo = new CanvasVideo({
      videoEl: this.webVideoEl,
      width: this.playerRootEl?.clientWidth,
      height: this.playerRootEl?.clientHeight,
    })
    const updateSize = throttle(() => {
      if (!this.playerRootEl) return
      canvasVideo.updateSize({
        width: this.playerRootEl.clientWidth,
        height: this.playerRootEl.clientHeight,
      })
    }, 500)

    updateSize()
    this.addCallback(
      this.on2(PlayerEvent.resize, () => {
        updateSize()
      })
    )
    console.log('canvasVideo', canvasVideo)
    return canvasVideo.canvasVideoStream
  }
  get webPlayerVideoStream() {
    return (this.webVideoEl as any).captureStream() as MediaStream
  }

  protected renderReactVideoPlayer() {
    const pipWindow = window.documentPictureInPicture.window

    let isCanvasVideoMode =
        configStore.docPIP_renderType == DocPIPRenderType.reactVP_canvasCs,
      isWebVideoMode =
        configStore.docPIP_renderType == DocPIPRenderType.reactVP_webVideo

    // bilibili直播有一些页面是套同源iframe的，例如瓦洛兰特比赛什么的
    // 需要强制使用canvasVideoMode
    if (this.webVideoEl.ownerDocument !== document) {
      console.log('强制canvasVideoMode')
      isCanvasVideoMode = true
      isWebVideoMode = false
    }

    let vpRef: VideoPlayerHandle
    const root = createElement('div')
    this.playerRootEl = createElement('div', {
      children: [root, styleEl],
    })
    const reactRoot = createRoot(root)

    const vpProps: ComponentProps<typeof VideoPlayerV2> = (() => {
      // webVideo模式，使用原生video标签
      if (isWebVideoMode) return { useWebVideo: true }
      // canvas模式，传入canvasVideo的stream
      if (isCanvasVideoMode)
        return {
          srcObject: this.canvasVideoStream,
        }

      return {
        // 最后一个设置的使用reactVP_cs
        srcObject: this.webPlayerVideoStream,
      }
    })()

    console.log('vpProps', vpProps)

    reactRoot.render(
      <VideoPlayerV2
        // 外挂插件
        subtitleManager={this.subtitleManager}
        danmakuSender={this.danmakuSender}
        danmakuEngine={this.danmakuEngine}
        sideSwitcher={this.sideSwitcher}
        // ----
        webVideo={this.webVideoEl}
        keydownWindow={pipWindow}
        ref={(ref) => {
          if (!ref) return
          vpRef = ref
        }}
        // emit事件
        // onSeeked={() => this.emit(PlayerEvent.seeked)}
        // onPlay={() => this.emit(PlayerEvent.play)}
        // onPause={() => this.emit(PlayerEvent.pause)}
        {...vpProps}
      />
    )

    this.on(PlayerEvent.webVideoChanged, (newVideoEl) => {
      // 只给reactVP_webVideo模式监听
      if (isWebVideoMode) {
        console.log('observeVideoElChange', newVideoEl)
        vpRef.updateVideo(newVideoEl)

        if (this.subtitleManager) {
          this.subtitleManager.updateVideo(newVideoEl)
        }
        if (this.danmakuEngine) {
          this.danmakuEngine.updateVideo(newVideoEl)
        }

        // 控制要不要把上一个还原
        restoreWebVideoPlayerElState =
          this.initWebVideoPlayerElState(newVideoEl)
      }
    })

    // 用来把video元素还原回原本位置的方法
    let restoreWebVideoPlayerElState = () => {}
    if (isWebVideoMode) {
      restoreWebVideoPlayerElState = this.initWebVideoPlayerElState(
        this.webVideoEl
      )
    }

    this.on(PlayerEvent.close, () => {
      reactRoot.unmount()
      this.playerRootEl = undefined
      restoreWebVideoPlayerElState()
    })
  }
}
