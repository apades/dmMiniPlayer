import { PlasmoCSConfig } from 'plasmo'
import { getWebProvider } from '../web-provider'
import { listen } from '@plasmohq/messaging/message'
import AsyncLock from '@root/utils/AsyncLock'
// import {} from '@plasmohq/messaging/port'

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
