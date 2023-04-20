import { PlasmoCSConfig } from 'plasmo'
import { getWebProvider } from '../web-provider'

export const config: PlasmoCSConfig = {
  matches: ['https://www.bilibili.com/*', 'https://live.bilibili.com/*'],
  run_at: 'document_end',
  all_frames: true,
}

console.log('run content')

let provider = getWebProvider()

window.getWebProvider = getWebProvider
window.provider = provider
