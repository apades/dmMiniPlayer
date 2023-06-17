import type { PlasmoMessaging } from '@plasmohq/messaging'
import Browser from 'webextension-polyfill'

export type RequestResponse = number

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  Browser.windows.create({
    url: Browser.runtime.getURL('/tabs/performance.html'),
    height: 420,
    width: 680,
    type: 'panel',
  })
}

export default handler
