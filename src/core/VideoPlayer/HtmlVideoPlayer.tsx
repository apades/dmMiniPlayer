import configStore, { DocPIPRenderType } from '@root/store/config'
import { addEventListener, createElement, throttle } from '@root/utils'
import { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import CanvasVideo from '../CanvasVideo'
import { PlayerEvent } from '../event'
import VideoPlayerBase from './VideoPlayerBase'
// import style from '@root/components/VideoPlayer/index.less?inline'
import VideoPlayerV2, {
  VideoPlayerHandle,
} from '@root/components/VideoPlayerV2'
import Browser from 'webextension-polyfill'
import { sendMessage as sendBgMessage } from 'webext-bridge/content-script'
import WebextEvent from '@root/shared/webextEvent'

const styleEl = createElement('div', {
  className: 'style-list',
  children: [
    createElement('link', {
      rel: 'stylesheet',
      href: Browser.runtime.getURL('/css.css'),
    }),
  ],
})

export class HtmlVideoPlayer extends VideoPlayerBase {
  playerRootEl?: HTMLElement

  async onInit() {
    await this.renderReactVideoPlayer()
    // this.on(PlayerEvent.close, () => {})
  }

  private unloadPreCanvasVideoStream = () => {}
  get canvasVideoStream() {
    this.unloadPreCanvasVideoStream()

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
    const unListenResize = this.on2(PlayerEvent.resize, () => {
      updateSize()
    })
    console.log('canvasVideo', canvasVideo)

    this.unloadPreCanvasVideoStream = () => {
      canvasVideo.stopRenderAsCanvas()
      unListenResize()
    }
    return canvasVideo.canvasVideoStream
  }
  get webPlayerVideoStream() {
    return (this.webVideoEl as any).captureStream() as MediaStream
  }

  protected async renderReactVideoPlayer() {
    let vpRef: VideoPlayerHandle
    const root = createElement('div')
    this.playerRootEl = createElement('div', {
      children: [root, styleEl],
    })
    const reactRoot = createRoot(root)

    const commonProps: ComponentProps<typeof VideoPlayerV2> = {
      subtitleManager: this.subtitleManager,
      danmakuSender: this.danmakuSender,
      danmakuEngine: this.danmakuEngine,
      sideSwitcher: this.sideSwitcher,
      videoPlayer: this,
      webVideo: this.webVideoEl,
      ref: (ref) => {
        if (!ref) return
        vpRef = ref
      },
      isLive: this.isLive,
    }

    let renderMode = configStore.docPIP_renderType

    // bilibili直播有一些页面是套同源iframe的，例如瓦洛兰特比赛什么的
    // 需要强制使用canvasVideoMode
    if (
      this.webVideoEl.ownerDocument !== document &&
      // 三方url可以直接转移video dom，blob才不行需要canvasVideoMode
      this.webVideoEl.src.startsWith('blob:')
    ) {
      console.log(
        `🟡 强制 ${configStore.sameOriginIframeCaptureModePriority} 模式`
      )
      renderMode = configStore.sameOriginIframeCaptureModePriority
    }

    // 非同源模式，像agemys、crunchyroll这种，需要录制模式
    if (window.__cropTarget) {
      console.log(
        `🟡 强制 ${configStore.notSameOriginIframeCaptureModePriority} 模式`
      )
      renderMode = configStore.notSameOriginIframeCaptureModePriority
    }

    const isWebVideoMode = renderMode === DocPIPRenderType.replaceVideoEl,
      isCanvasVideoMode =
        renderMode === DocPIPRenderType.capture_captureStreamWithCanvas

    const playerComponent = await (async () => {
      switch (renderMode) {
        case DocPIPRenderType.capture_captureStreamWithCanvas:
          return (
            <VideoPlayerV2
              {...commonProps}
              videoStream={this.canvasVideoStream}
            />
          )
        case DocPIPRenderType.replaceVideoEl:
          return <VideoPlayerV2 {...commonProps} useWebVideo />
        case DocPIPRenderType.capture_captureStream:
          return (
            <VideoPlayerV2
              {...commonProps}
              videoStream={this.webPlayerVideoStream}
            />
          )
        // TODO
        case DocPIPRenderType.capture_captureStreamWithWebRTC:
          return
        case DocPIPRenderType.capture_displayMedia: {
          if (!window.__cropTarget) throw Error('没有定义__cropTarget')
          const stream = await navigator.mediaDevices.getDisplayMedia({
            preferCurrentTab: true,
            video: { frameRate: 60 },
            audio: false,
          })
          const [track] = stream.getVideoTracks()
          track.addEventListener('ended', () => {
            this.emit(PlayerEvent.close)
          })
          await track.cropTo(window.__cropTarget)
          return <VideoPlayerV2 {...commonProps} videoStream={stream} />
        }

        case DocPIPRenderType.capture_tabCapture:
          if (!window.__cropTarget) throw Error('没有定义__cropTarget')
          // TODO 提示用户点击下插件icon
          // 这里必须要用户点击插件icon或者右键菜单功能才能用tapCapture功能 😅
          const data = await sendBgMessage(WebextEvent.startTabCapture, null)
          if (!data.streamId) throw Error('没有获取到streamId')
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              mandatory: {
                maxFrameRate: configStore.capture_tabCapture_FPS,
                chromeMediaSource: 'tab',
                chromeMediaSourceId: data.streamId,
              },
            },
            audio: false,
          })
          const [track] = stream.getVideoTracks()
          track.addEventListener('ended', () => {
            this.emit(PlayerEvent.close)
          })
          this.on(PlayerEvent.close, () => {
            try {
              track.stop()
            } catch (error) {}
          })
          if (configStore.capture_tabCapture_clip) {
            // FIXME 非常卡，tab都卡爆了
            // tabCapture不支持cropTarget，所以需要手动裁剪
            const videoEl = createElement('video', {
              srcObject: stream,
            })
            videoEl.play()
            const canvasVideo = new CanvasVideo({
              videoEl,
              width: window.__cropPos.w,
              height: window.__cropPos.h,
              x: -window.__cropPos.x,
              y: -window.__cropPos.y,
              fps: configStore.capture_tabCapture_FPS,
            })
            return (
              <VideoPlayerV2
                {...commonProps}
                videoStream={canvasVideo.canvasVideoStream}
              />
            )
          } else {
            return <VideoPlayerV2 {...commonProps} videoStream={stream} />
          }
      }
    })()

    if (!playerComponent) throw new Error(`未支持的renderMode: ${renderMode}`)

    reactRoot.render(playerComponent)

    this.on(PlayerEvent.webVideoChanged, (newVideoEl) => {
      console.log('observeVideoElChange', newVideoEl)
      this.webVideoEl = newVideoEl

      if (isWebVideoMode) {
        vpRef.updateVideo(newVideoEl)
        // 控制要不要把上一个还原
        restoreWebVideoPlayerElState =
          this.initWebVideoPlayerElState(newVideoEl)
      } else if (isCanvasVideoMode) {
        const canvasVideoStream = this.canvasVideoStream
        vpRef.updateVideoStream(canvasVideoStream)
        // vpRef.updateVideo(newVideoEl)
        setTimeout(() => {
          vpRef.updateVideo(newVideoEl)
        }, 0)
      } else {
        vpRef.updateVideo(newVideoEl)
        setTimeout(() => {
          vpRef.updateVideoStream(this.webPlayerVideoStream)
        }, 0)
      }

      if (this.subtitleManager) {
        this.subtitleManager.updateVideo(newVideoEl)
      }
      if (this.danmakuEngine) {
        this.danmakuEngine.updateVideo(newVideoEl)
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
      this.unloadPreCanvasVideoStream()
    })
  }
}
