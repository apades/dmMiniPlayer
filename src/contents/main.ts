import { PlasmoCSConfig } from 'plasmo'
import { getWebProvider } from '../web-provider'
import { listen } from '@plasmohq/messaging/message'
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

listen((req, res) => {
  switch (req.name) {
    case 'player-startPIPPlay': {
      provider.startPIPPlay()
      break
    }
  }
})

window.getWebProvider = getWebProvider
window.provider = provider
