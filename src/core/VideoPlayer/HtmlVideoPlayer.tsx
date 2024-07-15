import VideoPlayer, { VideoPlayerHandle } from '@root/components/VideoPlayer'
import configStore, { DocPIPRenderType } from '@root/store/config'
import { createElement } from '@root/utils'
import { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import CanvasVideo from '../CanvasVideo'
import { PlayerEvent } from '../event'
import VideoPlayerBase from './VideoPlayerBase'
// style
import tailwind from '@root/style/tailwind.css?inline'
import tailwindBase from '@root/style/tailwindBase.css?inline'
import style from '@root/components/VideoPlayer/index.less?inline'

const styleEl = createElement('div', {
  className: 'style-list',
  children: [tailwindBase, tailwind, style].map((style) =>
    createElement('style', { innerHTML: style })
  ),
})
const vpMode = {
  get isWebVideoMode() {
    return configStore.docPIP_renderType == DocPIPRenderType.reactVP_webVideo
  },
  get isCanvasVideoMode() {
    return configStore.docPIP_renderType == DocPIPRenderType.reactVP_canvasCs
  },
}

export class HtmlVideoPlayer extends VideoPlayerBase {
  playerRootEl?: HTMLElement

  onInit(): void {
    this.renderReactVideoPlayer()
    this.on(PlayerEvent.close, () => {})
  }

  get canvasVideoStream() {
    const canvasVideo = new CanvasVideo({ videoEl: this.webVideoEl })
    return canvasVideo.canvasVideoStream
  }
  get webPlayerVideoStream() {
    return (this.webVideoEl as any).captureStream() as MediaStream
  }

  protected renderReactVideoPlayer() {
    const pipWindow = window.documentPictureInPicture.window

    const { isCanvasVideoMode, isWebVideoMode } = vpMode

    let vpRef: VideoPlayerHandle
    const root = createElement('div')
    this.playerRootEl = createElement('div', {
      children: [root, styleEl],
    })
    const reactRoot = createRoot(root)

    const vpProps: ComponentProps<typeof VideoPlayer> = (() => {
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

    reactRoot.render(
      <VideoPlayer
        index={1}
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
          window.vpRef = vpRef
        }}
        // emit事件
        onSeeked={() => this.emit('seek')}
        onPlay={() => this.emit('play')}
        onPause={() => this.emit('pause')}
        {...vpProps}
      />
    )

    this.on(PlayerEvent.webVideoChanged, (newVideoEl) => {
      // 只给reactVP_webVideo模式监听
      if (isWebVideoMode) {
        console.log('observeVideoElChange', newVideoEl)
        vpRef.updateVideo(newVideoEl)
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
