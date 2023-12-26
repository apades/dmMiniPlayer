import { Storage } from '@plasmohq/storage'
import type { PlasmoCSConfig } from 'plasmo'

const extStorage = new Storage()
export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  run_at: 'document_end',
  all_frames: true,
}

const oClog = console.log

window.showLog = process.env.NODE_ENV === 'development'

extStorage.get<boolean>('showLog').then((res) => {
  if (typeof res == 'undefined') return

  window.showLog = res
})
window.console.log = (...args: any[]) => {
  if (!window.showLog) return
  oClog(...args)
}

window.setShowLog = (show: boolean) => {
  window.showLog = show
  extStorage.set('showLog', show)
}
