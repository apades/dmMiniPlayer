import { PlasmoCSConfig } from 'plasmo'
import { getWebProvider } from '../web-provider'
import { listen } from '@plasmohq/messaging/message'
import AsyncLock from '@root/utils/AsyncLock'
import Browser from 'webextension-polyfill'
import { sendToBackground } from '@plasmohq/messaging'
import { getPort } from '@plasmohq/messaging/port'
// import {} from '@plasmohq/messaging/port'

Browser.runtime.connect
export const config: PlasmoCSConfig = {
  matches: [
    'https://www.bilibili.com/*',
    'https://live.bilibili.com/*',
    'https://www.douyu.com/*',
    'https://cc.163.com/*',
  ],
  run_at: 'document_end',
  // TODO CC有多个iframe，不知道对别的有没有影响
  // all_frames: true,
}

console.log('run content')

let provider = getWebProvider()

let hasClickPage = false
let clickLock = new AsyncLock()
document.body.addEventListener('click', () => {
  hasClickPage = true
  clickLock.ok()
})
listen(async (req, res) => {
  switch (req.name) {
    case 'player-startPIPPlay': {
      if (!hasClickPage) res.send({ state: 'error', type: 'click-page' })
      console.log('hasClickPage', hasClickPage)
      await clickLock.waiting()
      provider.startPIPPlay()
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

window.getWebProvider = getWebProvider
window.provider = provider

async function openPerformanceWindow() {
  sendToBackground({ name: 'open-performance-window' })
  let port = await getPort('cs-performance')
  port.postMessage({
    name: 'performance',
    body: `connect from ${location.href}`,
  })
  port.onDisconnect.addListener(() => {
    console.log('onDisconnect')
  })
  // port.onMessage.addListener((msg) => console.log('msg', msg))
  console.log('port', port)
}

window.openPerformanceWindow = openPerformanceWindow
