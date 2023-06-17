import '@plasmohq/messaging/background'
import _env from '@root/utils/env'
import Browser from 'webextension-polyfill'

if (_env.isDev) {
  const tabs = [{ title: 'test' }, { title: 'performance' }]

  tabs.forEach((tab, i) => {
    Browser.contextMenus.create({
      id: tab.title,
      type: 'normal',
      title: tab.title,
      contexts: ['all'],
    })
  })

  Browser.contextMenus.onClicked.addListener((e) => {
    Browser.tabs.create({
      url: Browser.runtime.getURL(`/tabs/${e.menuItemId}.html`),
    })
  })
}

export {}
