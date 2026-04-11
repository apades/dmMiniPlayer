import { requestInitPlayer } from '@root/core/requestPlayerInit'
import PostMessageEvent, {
  BaseVideoState,
  PostMessageProtocolMap,
  RequestPlayerInitFrom,
} from '@root/shared/postMessageEvent'
import { createElement, dq1Adv } from '@root/utils'
import { onPostMessage, postMessageToChild } from '@root/utils/windowMessages'

export const getTime = () => new Date().getTime()
export const getSimulateVideoEl = (
  data: BaseVideoState,
  captureSource: Window,
) => {
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
      captureSource,
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

export const requestInitPlayerFromMainCs = async (props: {
  from: RequestPlayerInitFrom
}) => {
  let videoEl = dq1Adv('video')
  let isIframeMode = false

  // if not found videoEl, try to find in all iframe
  if (!videoEl) {
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
          },
        )
      }),
      new Promise<void>((res) => {
        setTimeout(() => {
          res()
        }, 2000)
      }),
    ])
    stopListenMessage()

    isIframeMode = videoList.length > 0

    if (isIframeMode) {
      // find the biggest videoEl
      const targetVideo = videoList.reduce((a, b) => {
        if (a.w * a.h > b.w * b.h) return a
        return b
      })

      postMessageToChild(
        PostMessageEvent.requestPlayerInitFromVid,
        {
          id: targetVideo.id,
          from: props.from,
        },
        targetVideo.source,
      )

      if (!navigator.userActivation.isActive)
        return { state: 'error', errType: 'user-activation' }
      return { state: 'ok' }
    }
  }

  if (!videoEl) {
    return { state: 'error', errType: 'no-video' }
  }

  requestInitPlayer({
    from: props.from,
    videoEl,
  })

  if (!navigator.userActivation.isActive)
    return { state: 'error', errType: 'user-activation' }
  return { state: 'ok' }
}
