import browser from 'webextension-polyfill'
import { sendToContentScript } from '@plasmohq/messaging'
import { listen } from '@plasmohq/messaging/message'
// import { activeTabId } from './messages/pip-active'

browser.commands.onCommand.addListener(async (command, tab) => {
  if (activeTabId) {
    if (command == 'show/hide') {
      // await browser.tabs.highlight({ tabs: activeTabIndex })
      // await browser.tabs.update(activeTabId, {
      //   active: true,
      //   highlighted: true,
      // })
    }
    sendToContentScript({
      name: 'PIP-action',
      body: command,
      tabId: activeTabId,
    })
  }
})

let activeTabId: number, activeTabIndex: number
listen((req, res) => {
  console.log('active', req)
  if (req.name != 'PIP-active') return
  activeTabId = req.sender.tab.id
  activeTabIndex = req.sender.tab.index
})
