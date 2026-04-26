import browser from 'webextension-polyfill'
import { onMessage, sendMessage } from 'webext-bridge/background'
import WebextEvent from '@root/shared/webextEvent'

let activeTabId: number | null = null
browser.commands.onCommand.addListener(async (command: any, tab) => {
  console.log('command', command)
  if (activeTabId) {
    sendMessage(
      WebextEvent.extCommand,
      {
        command,
      },
      {
        tabId: activeTabId,
        context: 'content-script',
      },
    )
  }
})

onMessage(WebextEvent.setExtActive, (req) => {
  const tabId = req.sender.tabId
  // Avoid the following situation
  // -> active: true  id: 1
  // -> active: true  id: 2
  // -> active: false id: 1
  if (!req.data.active) {
    if (activeTabId === tabId) activeTabId = null
    return
  }
  activeTabId = tabId
  console.log('active', tabId)
})
