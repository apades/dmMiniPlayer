import getWebProvider from '../web-provider/getWebProvider'
import { onMessage as onBgMessage } from 'webext-bridge/content-script'
import { onMessage } from '@root/inject/contentSender'
import { createElement, dq1Adv } from '@root/utils'
import { WebProvider } from '@root/core/WebProvider'

console.log('run content')

let provider = () => {
  let provider = getWebProvider()
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
  await provider()?.openPlayer(props)
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

try {
  navigator.mediaSession.setActionHandler('enterpictureinpicture', () => {
    provider()?.openPlayer()
  })
} catch (error) {
  console.log('🟡 No support mediaSession action enterpictureinpicture')
}

window.getWebProvider = getWebProvider
