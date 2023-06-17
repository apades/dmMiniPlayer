import Browser from 'webextension-polyfill'

export function openPerformanceWindow() {
  Browser.windows.create({
    url: Browser.runtime.getURL('/tabs/performance.html'),
    height: 420,
    width: 680,
  })
}
