import getWebProvider from '../web-provider/getWebProvider'
import { onMessage as onBgMessage } from 'webext-bridge/content-script'
import AsyncLock from '@root/utils/AsyncLock'
import { onMessage } from '@root/inject/contentSender'
import { onceCall } from '@root/utils'

console.log('run content')

let provider = onceCall(() => {
  let provider = getWebProvider()
  window.provider = provider
  return provider
})

let hasClickPage = false,
  isWaiting = false
let clickLock = new AsyncLock()
window.addEventListener('click', () => {
  hasClickPage = true
  clickLock.ok()
})

const handleBlur = () => {
  console.log('blur')
  hasClickPage = false
  clickLock.reWaiting()
  window.removeEventListener('blur', handleBlur)
}

const openPIP = async () => {
  if (isWaiting) return
  isWaiting = true
  await clickLock.waiting()
  isWaiting = false
  provider().startPIPPlay()

  window.addEventListener('blur', handleBlur)
}
onBgMessage('player-startPIPPlay', async (req) => {
  if (!hasClickPage) {
    const coverEl = document.createElement('div')
    ;(coverEl as any).style =
      'width:100%;height:100%;position:fixed;top:0;left:0;z-index:9999999;'
    document.body.appendChild(coverEl)
    coverEl.addEventListener('click', () => {
      document.body.removeChild(coverEl)
      openPIP()
    })
    return { state: 'error', type: 'click-page' }
  }
  openPIP()
  return { state: 'ok' }
})

onMessage('start-PIP', (data) => {
  provider().startPIPPlay({ videoEl: data.videoEl })
})

try {
  navigator.mediaSession.setActionHandler('enterpictureinpicture', () => {
    provider().startPIPPlay()
  })
} catch (error) {
  console.log('🟡 No support mediaSession action enterpictureinpicture')
}

window.getWebProvider = getWebProvider
