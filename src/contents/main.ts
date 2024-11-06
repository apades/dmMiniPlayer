import _getWebProvider from '../web-provider/getWebProvider'
import { onMessage as onBgMessage } from 'webext-bridge/content-script'
import { onMessage } from '@root/inject/contentSender'
import { createElement, dq, dq1Adv } from '@root/utils'
import { WebProvider } from '@root/core/WebProvider'
import './floatButton'
import { pick } from 'lodash-es'

console.log('run content')

let provider: WebProvider | undefined
let getProvider = () => {
  provider = _getWebProvider()
  window.provider = provider
  return provider
}

const waitingPageActive = async () => {
  console.log(
    'navigator.userActivation.isActive',
    navigator.userActivation.isActive
  )
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

const openPlayer = async (props?: Parameters<WebProvider['openPlayer']>[0]) => {
  // 避免多次open
  if (isWaiting) return
  isWaiting = true
  await getProvider()?.openPlayer(props)
  isWaiting = false
}

// 从popup点击过来的消息
onBgMessage('player-startPIPPlay', async (req) => {
  const hasVideo = !!dq1Adv('video')
  if (!hasVideo) {
    return { state: 'error', type: 'no-video' }
  }

  if (!navigator.userActivation.isActive) {
    waitingPageActive().then(() => {
      openPlayer()
    })
    return { state: 'error', type: 'click-page' }
  }

  openPlayer()
  return { state: 'ok' }
})

onBgMessage('open-setting', () => {
  window.openSettingPanel()
})

// 从子iframe里过来的消息
onMessage('start-PIP', (data) => {
  openPlayer({ videoEl: data.videoEl })
})

let captureSource: Window | undefined
const updateCaptureSourceVideoState = (data: any) => {
  console.log('updateCaptureIframeVideoState', data, captureSource)
  if (!captureSource) return
  captureSource.postMessage(
    {
      from: 'dmMiniPlayer-main',
      type: 'update-video-state',
      data,
    },
    '*'
  )
}
const getTime = () => new Date().getTime()
onMessage('start-PIP-capture-displayMedia', async (data) => {
  window.__cropTarget = data.cropTarget

  window.__cropPos = pick(data, ['x', 'y', 'w', 'h', 'vw', 'vh'])
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
    window.__cropPos.x += targetIframeRect.x
    window.__cropPos.y += targetIframeRect.y
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
  setInterval(() => {
    if (isPause) {
      now = getTime()
      return
    }
    const nowTime = getTime()
    currentTime += (nowTime - now) / 1000
    now = nowTime
    videoEl.dispatchEvent(new CustomEvent('timeupdate'))
  }, 1000)

  openPlayer({ videoEl })
})

// 非同源iframe只能通过postMessage通信
window.addEventListener('message', (e) => {
  const data = e.data
  if (data?.from !== 'dmMiniPlayer') return
  if (data?.type === 'start-PIP-capture-displayMedia') {
    captureSource = e.source as Window
  }

  window.dispatchEvent(
    new CustomEvent('inject-response', {
      detail: {
        type: data.type,
        data: data.data,
      },
    })
  )
})

try {
  navigator.mediaSession.setActionHandler('enterpictureinpicture', () => {
    getProvider()?.openPlayer()
  })
} catch (error) {
  console.log('🟡 No support mediaSession action enterpictureinpicture')
}

window.getWebProvider = _getWebProvider
