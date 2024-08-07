import Browser from 'webextension-polyfill'

const extStorage = Browser.storage.local

const oClog = console.log

window.showLog = process.env.NODE_ENV === 'development'

extStorage.get('showLog').then((res) => {
  if (typeof res?.['showLog'] == 'undefined') return

  window.showLog = res['showLog']
})

window.console.log = (...args: any[]) => {
  if (!window.showLog) return
  oClog(...args)
}

window.setShowLog = (show: boolean) => {
  window.showLog = show
  extStorage.set({ showLog: show })
}
