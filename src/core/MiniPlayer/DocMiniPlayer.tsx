import { createElement, dq1 } from '@root/utils'
import MiniPlayer from './MiniPlayer'

import style from './DocMiniPlayer.less?inline'
import tailwindBase from '@root/style/tailwindBase.css?inline'
import tailwind from '@root/style/tailwind.css?inline'
import { createRoot } from 'react-dom/client'
import VideoPlayer, { VideoPlayerHandle } from '@root/components/VideoPlayer'
import configStore, { DocPIPRenderType } from '@root/store/config'
import CanvasVideo from '../CanvasVideo'
import { observeVideoEl } from '@root/utils/observeVideoEl'
import { onVideoPlayerLoad } from '@root/components/VideoPlayer/events'
import { PlayerEvent } from '../event'

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

export default class DocMiniPlayer extends MiniPlayer {
  playerRootEl: HTMLElement

  onInit() {}

  get canvasVideoStream() {
    const canvasVideo = new CanvasVideo({ videoEl: this.webVideoEl })
    return canvasVideo.canvasVideoStream
  }
  get webPlayerVideoStream() {
    return (this.webVideoEl as any).captureStream() as MediaStream
  }

  protected async renderReactVideoPlayer() {
    const pipWindow = window.documentPictureInPicture.window

    const { isCanvasVideoMode, isWebVideoMode } = vpMode

    let vpRef: VideoPlayerHandle
    const root = createElement('div')
    this.playerRootEl = createElement('div', {
      children: [root, styleEl],
    })
    const reactRoot = createRoot(root)

    reactRoot.render(
      <VideoPlayer
        index={1}
        subtitleManager={this.subtitleManager}
        webVideo={this.webVideoEl}
        keydownWindow={pipWindow}
        // 差异化传参
        {
          // webVideo模式，使用原生video标签
          ...((isWebVideoMode && { useWebVideo: true }) ||
            // canvas模式，传入canvasVideo的stream
            (isCanvasVideoMode && {
              srcObject: this.canvasVideoStream,
            }) || {
              // 最后一个设置的使用reactVP_cs
              srcObject: this.webPlayerVideoStream,
            })
        }
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
      this.webVideoEl,
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
        this.webVideoEl
      )
    }

    // video标签切换时
    this.updateWebVideoPlayerEl = (videoEl) => {
      this.webVideoEl = videoEl
      console.log('updateWebVideoPlayerEl', videoEl)
      vpRef.updateVideo(videoEl)
      if (isWebVideoMode) {
        // 控制要不要把上一个还原
        restoreWebVideoPlayerElState = this.initWebVideoPlayerElState(videoEl)
      }
    }

    await onVideoPlayerLoad()
    this.on(PlayerEvent.close, () => {
      reactRoot.unmount()
      this.playerRootEl = null
      restoreWebVideoPlayerElState()
      unobserveVideoElChange()
    })
  }

  protected updateWebVideoPlayerEl(videoEl: HTMLVideoElement) {}

  /**return的函数运行是还原videoEl位置和状态 */
  protected initWebVideoPlayerElState(videoEl: HTMLVideoElement) {
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

  async getPlayerEl() {
    await this.renderReactVideoPlayer()
    return this.playerRootEl
  }
  async getMediaStream() {
    const videoEl = dq1('video', this.playerRootEl)

    return (videoEl as any).captureStream() as MediaStream
  }
}
