import browser from 'webextension-polyfill'
import { onMessage, sendMessage } from 'webext-bridge/background'
// import { activeTabId } from './messages/pip-active'

browser.commands.onCommand.addListener(async (command, tab) => {
  console.log('command', command)
  if (activeTabId) {
    sendMessage(
      'PIP-action',
      {
        name: 'PIP-action',
        body: command,
      },
      {
        tabId: activeTabId,
        context: 'content-script',
      },
    )
  }
})

let activeTabId: number, activeTabIndex: number
onMessage('PIP-active', (req) => {
  console.log('active', req)
  activeTabId = req.sender.tabId
})
