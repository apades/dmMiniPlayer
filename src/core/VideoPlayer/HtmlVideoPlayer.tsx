import AppRoot from '@root/components/AppRoot'
import VideoPlayerV2, {
  VideoPlayerHandle,
} from '@root/components/VideoPlayerV2'
import WebextEvent from '@root/shared/webextEvent'
import configStore from '@root/store/config'
import { createElement, throttle, tryCatch } from '@root/utils'
import { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import { sendMessage as sendBgMessage } from 'webext-bridge/content-script'
import { DocPIPRenderType } from '@root/types/config'
import CanvasVideo from '../CanvasVideo'
import { PlayerEvent } from '../event'
import VideoPlayerBase, { supportOnVideoChangeTypes } from './VideoPlayerBase'

const docPIPStyleEl = createElement('style', {
  innerText: 'html, body { height: 100% }',
})

export class HtmlVideoPlayer extends VideoPlayerBase {
  playerRootEl?: HTMLElement

  override async onInit() {
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
    const root = createElement('div', {
      className: 'h-full',
    })
    this.playerRootEl = createElement('div', {
      className: 'h-full',
      children: [root, docPIPStyleEl],
    })
    const reactRoot = createRoot(root)

    const commonProps: ComponentProps<typeof VideoPlayerV2> = {
      subtitleManager: this.subtitleManager,
      danmakuSender: this.danmakuSender,
      danmakuEngine: this.danmakuEngine,
      sideSwitcher: this.sideSwitcher,
      videoPreviewManger: this.videoPreviewManager,
      videoPlayer: this,
      webVideo: this.webVideoEl,
      ref: (ref) => {
        if (!ref) return
        vpRef = ref
      },
      isLive: this.isLive,
      setContext: () => {},
      videoPlayerRef: { current: null },
    }

    const renderMode = this.config.renderType

    const playerComponent = await (async () => {
      switch (renderMode) {
        case DocPIPRenderType.replaceVideoEl:
          return <VideoPlayerV2 {...commonProps} useWebVideo />
        case DocPIPRenderType.replaceWebVideoDom:
          return <VideoPlayerV2 {...commonProps} useWebVideo isReplacerMode />
        case DocPIPRenderType.capture_captureStreamWithCanvas:
          return (
            <VideoPlayerV2
              {...commonProps}
              videoStream={this.canvasVideoStream}
            />
          )
        case DocPIPRenderType.capture_captureStream:
          return (
            <VideoPlayerV2
              {...commonProps}
              videoStream={this.webPlayerVideoStream}
            />
          )
        case DocPIPRenderType.capture_displayMediaWithCropTarget:
        case DocPIPRenderType.capture_displayMediaWithRestrictionTarget: {
          if (!this.config.cropTarget && !this.config.restrictionTarget)
            throw Error(
              `没有定义数据 cropTarget:${!this.config.cropTarget} restrictionTarget:${!this.config.restrictionTarget}`,
            )
          const stream = await navigator.mediaDevices.getDisplayMedia({
            preferCurrentTab: true,
            video: { frameRate: 60 },
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

          if (this.config.cropTarget) {
            await track.cropTo(this.config.cropTarget)
          }
          if (this.config.restrictionTarget) {
            await track.restrictTo(this.config.restrictionTarget)
          }
          return <VideoPlayerV2 {...commonProps} videoStream={stream} />
        }
        case DocPIPRenderType.capture_tabCapture:
          if (!this.config.posData) throw Error('没有定义this.config.posData')
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
              width: this.config.posData.w,
              height: this.config.posData.h,
              x: -this.config.posData.x,
              y: -this.config.posData.y,
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
        case DocPIPRenderType.capture_captureStreamWithWebRTC:
          if (!this.config.mediaStream)
            throw Error('没有定义this.config.mediaStream')
          return (
            <VideoPlayerV2
              {...commonProps}
              videoStream={this.config.mediaStream}
            />
          )
      }
    })()

    if (!playerComponent) throw new Error(`未支持的renderMode: ${renderMode}`)

    reactRoot.render(<AppRoot>{playerComponent}</AppRoot>)

    const supportOnVideoChange = supportOnVideoChangeTypes.includes(renderMode)

    this.on(PlayerEvent.webVideoChanged, (newVideoEl) => {
      console.log('observeVideoElChange', newVideoEl)
      this.webVideoEl = newVideoEl

      if (!supportOnVideoChange) return
      switch (renderMode) {
        case DocPIPRenderType.replaceWebVideoDom:
        case DocPIPRenderType.replaceVideoEl: {
          vpRef.updateVideo(newVideoEl)
          // 控制要不要把上一个还原
          restoreWebVideoPlayerElState =
            this.initWebVideoPlayerElState(newVideoEl)
          break
        }
        case DocPIPRenderType.capture_captureStreamWithCanvas: {
          const canvasVideoStream = this.canvasVideoStream
          vpRef.updateVideoStream(canvasVideoStream)
          // vpRef.updateVideo(newVideoEl)
          setTimeout(() => {
            vpRef.updateVideo(newVideoEl)
          }, 0)
          break
        }
        case DocPIPRenderType.capture_captureStream: {
          vpRef.updateVideo(newVideoEl)
          setTimeout(() => {
            vpRef.updateVideoStream(this.webPlayerVideoStream)
          }, 0)
          break
        }
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

    if (
      renderMode === DocPIPRenderType.replaceVideoEl ||
      renderMode === DocPIPRenderType.replaceWebVideoDom
    ) {
      restoreWebVideoPlayerElState = this.initWebVideoPlayerElState(
        this.webVideoEl,
      )
    }

    this.on(PlayerEvent.close, () => {
      // ReplacerWebProvider里套的一层container root unmount好像会传染到这个组件？这里再unmount会报错
      tryCatch(() => reactRoot.unmount())
      this.playerRootEl = undefined
      restoreWebVideoPlayerElState()
      this.unloadPreCanvasVideoStream()
    })
  }
}
