import { listen } from '@plasmohq/messaging/message'
import { onMessage } from '@root/inject/contentSender'
import { onceCall } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'
import { type PlasmoCSConfig } from 'plasmo'
import '../inject/client'
import getWebProvider from '../web-provider/getWebProvider'
// import {} from '@plasmohq/messaging/port'

export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  run_at: 'document_end',
  // TODO CC有多个iframe，不知道对别的有没有影响
  // all_frames: true,
}

// dev模式的refresh-react有问题，side用了hook就会报错
if (process.env.PLASMO_PUBLIC_IS_DEV) {
  ;(globalThis as any).$RefreshReg$ =
    (globalThis as any).$RefreshReg$ ?? function () {}
  ;(globalThis as any).$RefreshSig$ =
    (globalThis as any).$RefreshSig$ ??
    function () {
      return function (type: any) {
        return type
      }
    }
}

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
listen(async (req, res) => {
  switch (req.name) {
    case 'player-startPIPPlay': {
      if (!hasClickPage) {
        res.send({ state: 'error', type: 'click-page' })
        const coverEl = document.createElement('div')
        ;(coverEl as any).style =
          'width:100%;height:100%;position:fixed;top:0;left:0;z-index:9999999;'
        document.body.appendChild(coverEl)
        coverEl.addEventListener('click', () =>
          document.body.removeChild(coverEl)
        )
      }
      console.log('hasClickPage', hasClickPage)
      if (isWaiting) return
      isWaiting = true
      await clickLock.waiting()
      isWaiting = false
      provider().startPIPPlay()
      res.send({ state: 'ok' })

      function handleBlur() {
        console.log('blur')
        hasClickPage = false
        clickLock.reWaiting()
        window.removeEventListener('blur', handleBlur)
      }
      window.addEventListener('blur', handleBlur)
      return
    }
  }
})

window.addEventListener('floatBtn-PIP', (e: any) => {
  const data = e.detail
  provider().startPIPPlay({ videoEl: data.videoEl })
})

window.getWebProvider = getWebProvider
