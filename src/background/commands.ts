import browser from 'webextension-polyfill'
import { onMessage, sendMessage } from 'webext-bridge/background'
// import { activeTabId } from './messages/pip-active'

browser.commands.onCommand.addListener(async (command, tab) => {
  console.log('command', command)
  if (activeTabId) {
    if (command == 'show/hide') {
      // await browser.tabs.highlight({ tabs: activeTabIndex })
      // await browser.tabs.update(activeTabId, {
      //   active: true,
      //   highlighted: true,
      // })
    }
    sendMessage(
      'PIP-action',
      {
        name: 'PIP-action',
        body: command,
      },
      {
        tabId: activeTabId,
        context: 'content-script',
      }
    )
    // sendToContentScript({
    //   name: 'PIP-action',
    //   body: command,
    //   tabId: activeTabId,
    // })
  }
})

let activeTabId: number, activeTabIndex: number
onMessage('PIP-active', (req) => {
  console.log('active', req)
  activeTabId = req.sender.tabId
})
