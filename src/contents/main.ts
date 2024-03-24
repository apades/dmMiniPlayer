// import { type PlasmoCSConfig } from 'plasmo'
import getWebProvider from '../web-provider/getWebProvider'
import { onMessage as onBgMessage } from 'webext-bridge/content-script'
import AsyncLock from '@root/utils/AsyncLock'
import { onMessage } from '@root/inject/contentSender'
import { onceCall } from '@root/utils'

// export const config: PlasmoCSConfig = {
//   matches: ['<all_urls>'],
//   run_at: 'document_end',
//   // all_frames: true,
// }

// dev模式的refresh-react有问题，side用了hook就会报错
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
onBgMessage('player-startPIPPlay', async (req) => {
  if (!hasClickPage) {
    const coverEl = document.createElement('div')
    ;(coverEl as any).style =
      'width:100%;height:100%;position:fixed;top:0;left:0;z-index:9999999;'
    document.body.appendChild(coverEl)
    coverEl.addEventListener('click', () => document.body.removeChild(coverEl))
    return { state: 'error', type: 'click-page' }
  }
  console.log('hasClickPage', hasClickPage)
  if (isWaiting) return
  isWaiting = true
  await clickLock.waiting()
  isWaiting = false
  provider().startPIPPlay()

  function handleBlur() {
    console.log('blur')
    hasClickPage = false
    clickLock.reWaiting()
    window.removeEventListener('blur', handleBlur)
  }
  window.addEventListener('blur', handleBlur)
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
