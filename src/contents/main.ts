import _getWebProvider from '../web-provider/getWebProvider'
import { onMessage as onBgMessage } from 'webext-bridge/content-script'
import { onMessage } from '@root/inject/contentSender'
import {
  createElement,
  dq,
  dq1Adv,
  getAllNotSameOriginIframesWindow,
} from '@root/utils'
import { WebProvider } from '@root/core/WebProvider'
import './floatButton'
import { pick } from 'lodash-es'
import isTop from '@root/shared/isTop'
import WebextEvent from '@root/shared/webextEvent'
import {
  onPostMessage,
  postMessageToChild,
  postMessageToTop,
} from '@root/utils/windowMessages'
import PostMessageEvent, {
  BaseVideoState,
  PostMessageProtocolMap,
} from '@root/shared/postMessageEvent'
import { PlayerEvent } from '@root/core/event'
import { getMediaStreamInGetter } from '@root/utils/webRTC'
import playerConfig from '@root/store/playerConfig'
import { DocPIPRenderType } from '@root/store/config'

// iframe里就不用运行了
if (isTop) {
  console.log('run content')
  main()
} else {
  // 处理top发来的请求检测video标签
  onPostMessage(PostMessageEvent.detectVideo_req, () => {
    console.log('post', location.href, dq('video'))
    postMessageToTop(
      PostMessageEvent.detectVideo_resp,
      dq('video').map((v, i) => {
        return {
          id: v.getAttribute('data-dm-vid') || '',
          w: v.clientWidth,
          h: v.clientHeight,
          isMute: v.muted,
          isPlaying: !v.paused,
        }
      })
    )
  })
}

function main() {
  let provider: WebProvider | undefined
  let getProvider = () => {
    provider = _getWebProvider()
    window.provider = provider
    return provider
  }

  const waitingPageActive = async () => {
    if (navigator.userActivation.isActive) return
    return new Promise<void>((res) => {
      const coverEl = createElement('div')
      ;(coverEl as any).style =
        'width:100%;height:100%;position:fixed;top:0;left:0;z-index:9999999;'
      document.body.appendChild(coverEl)
      coverEl.addEventListener('click', (e) => {
        if (!e.isTrusted) return
        if (!navigator.userActivation.isActive) return
        document.body.removeChild(coverEl)
        res()
      })
    })
  }

  let isWaiting = false

  const openPlayer = async (
    props?: Parameters<WebProvider['openPlayer']>[0]
  ) => {
    // 避免多次open
    if (isWaiting) return
    isWaiting = true
    await getProvider()?.openPlayer(props)
    isWaiting = false
  }

  // 从popup点击过来的消息，这种是粗略查找最大视频
  onBgMessage(WebextEvent.requestVideoPIP, async (req) => {
    let hasVideo = !!dq1Adv('video')
    let isIframeMode = false

    // 没找到再启用非同源iframe查找
    if (!hasVideo) {
      const postedWindows = postMessageToChild(PostMessageEvent.detectVideo_req)

      let respCount = 0
      let stopListenMessage = () => {}
      const videoList: (PostMessageProtocolMap[PostMessageEvent.detectVideo_resp][number] & {
        source: Window
      })[] = []
      await Promise.race([
        new Promise<void>((res) => {
          stopListenMessage = onPostMessage(
            PostMessageEvent.detectVideo_resp,
            (data, source) => {
              respCount++

              videoList.push(...data.map((item) => ({ ...item, source })))
              if (respCount === postedWindows.length) {
                res()
              }
            }
          )
        }),
        new Promise<void>((res) => {
          setTimeout(() => {
            res()
          }, 2000)
        }),
      ])
      stopListenMessage()

      hasVideo = isIframeMode = videoList.length > 0

      if (isIframeMode) {
        // 找到最大的视频
        const targetVideo = videoList.reduce((a, b) => {
          if (a.w * a.h > b.w * b.h) return a
          return b
        })

        postMessageToChild(
          PostMessageEvent.requestVideoPIP,
          {
            id: targetVideo.id,
          },
          targetVideo.source
        )
        return { state: 'ok' }
      }
    }

    if (!hasVideo) {
      return { state: 'error', errType: 'no-video' }
    }

    if (!navigator.userActivation.isActive) {
      waitingPageActive().then(() => {
        openPlayer()
      })
      return { state: 'error', errType: 'user-activation' }
    }

    openPlayer()
    return { state: 'ok' }
  })

  onBgMessage(WebextEvent.openSetting, () => {
    window.openSettingPanel()
  })

  // 从子iframe里过来的消息
  onPostMessage(PostMessageEvent.startPIPFromButtonClick, (data) => {
    openPlayer({ videoEl: dq1Adv(`video[data-dm-vid="${data.id}"]`) })
  })

  const getTime = () => new Date().getTime()

  const getSimulateVideoEl = (data: BaseVideoState, captureSource: Window) => {
    const id = data.id
    type UpdateData = Omit<
      PostMessageProtocolMap[PostMessageEvent.updateVideoState],
      'id'
    >
    const updateCaptureSourceVideoState = (data: UpdateData) => {
      if (!captureSource) return
      postMessageToChild(
        PostMessageEvent.updateVideoState,
        { ...data, id },
        captureSource
      )
    }

    const videoEl = createElement('video')

    let isPause = data.isPause,
      currentTime = data.currentTime

    Object.defineProperties(videoEl, {
      duration: {
        get: () => data.duration,
      },
      currentTime: {
        get: () => currentTime,
        set: (val) => {
          updateCaptureSourceVideoState({ currentTime: val })
          currentTime = val
        },
      },
      paused: {
        get: () => isPause,
      },
      buffered: {
        get: () => {
          return {
            start: () => 0,
            end: () => data.duration,
            length: 1,
          } satisfies TimeRanges
        },
      },
      pause: {
        get: () => () => {
          updateCaptureSourceVideoState({ isPause: true })
          isPause = true
          videoEl.dispatchEvent(new CustomEvent('pause'))
        },
      },
      play: {
        get: () => async () => {
          updateCaptureSourceVideoState({ isPlay: true })
          isPause = false
          videoEl.dispatchEvent(new CustomEvent('play'))
        },
      },
    })

    let now = getTime()
    const timer = setInterval(() => {
      if (isPause) {
        now = getTime()
        return
      }
      const nowTime = getTime()
      currentTime += (nowTime - now) / 1000
      now = nowTime
      videoEl.dispatchEvent(new CustomEvent('timeupdate'))
    }, 1000)

    return {
      videoEl,
      unMount: () => {
        clearInterval(timer)
      },
    }
  }

  // 下面2个是从非同源iframe发起的PIP启动数据
  onPostMessage(
    PostMessageEvent.startPIPFromFloatButton,
    async (data, captureSource) => {
      if (data.cropTarget) {
        playerConfig.cropTarget = data.cropTarget
      }
      if (data.restrictionTarget) {
        playerConfig.restrictionTarget = data.restrictionTarget
      }
      playerConfig.forceDocPIPRenderType = data.renderType
      playerConfig.posData = data.posData

      const id = data.videoState.id

      const isWebRTCMode =
        data.renderType === DocPIPRenderType.capture_captureStreamWithWebRTC

      switch (data.renderType) {
        case DocPIPRenderType.capture_captureStreamWithWebRTC:
        case DocPIPRenderType.capture_displayMediaWithCropTarget:
        case DocPIPRenderType.capture_displayMediaWithRestrictionTarget: {
          // 判断captureSource是iframe里还是top发起的
          const isIframe = captureSource !== window

          if (isIframe) {
            const targetIframeEl = dq('iframe').find(
              (iframeEl) => iframeEl.contentWindow === captureSource
            )
            if (!targetIframeEl) {
              console.error('captureSource', captureSource)
              throw Error('找不到captureSource iframe')
            }
            const targetIframeRect = targetIframeEl.getBoundingClientRect()
            playerConfig.posData.x += targetIframeRect.x
            playerConfig.posData.y += targetIframeRect.y
          }

          const { videoEl, unMount } = getSimulateVideoEl(
            data.videoState,
            captureSource
          )

          // webRTC模式
          if (isWebRTCMode) {
            const { mediaStream, unMount: unMountMediaStream } =
              getMediaStreamInGetter({ target: captureSource })
            playerConfig.webRTCMediaStream = mediaStream

            openPlayer({ videoEl })
            provider?.on(PlayerEvent.close, () => {
              unMountMediaStream()
              unMount()
              playerConfig.clear()
            })
          } else {
            openPlayer({ videoEl })
            provider?.on(PlayerEvent.close, () => {
              unMount()
              playerConfig.clear()
            })
          }
          return
        }
        default: {
          return openPlayer({ videoEl: dq1Adv(`video[data-dm-vid="${id}"]`) })
        }
      }
    }
  )

  onPostMessage(PostMessageEvent.openSettingPanel, () => {
    window.openSettingPanel()
  })
  try {
    navigator.mediaSession.setActionHandler('enterpictureinpicture', () => {
      getProvider()?.openPlayer()
    })
  } catch (error) {
    console.log('🟡 No support mediaSession action enterpictureinpicture')
  }

  window.getWebProvider = _getWebProvider
}
