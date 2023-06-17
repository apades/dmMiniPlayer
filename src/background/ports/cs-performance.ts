import type { PlasmoMessaging } from '@plasmohq/messaging'
import { getPort, getPortMap } from '@plasmohq/messaging/background'
import Browser from 'webextension-polyfill'

const relayName = 'page-performance'
const historyBody: any[] = []
const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  let { body } = req
  let port = getPortMap().get(relayName)
  if (!port) {
    historyBody.push(body)
  } else port.postMessage({ name: relayName, body })
}

Browser.runtime.onConnect.addListener((port) => {
  if (port.name == relayName) {
    while (historyBody.length) {
      port.postMessage({ name: relayName, body: historyBody.shift() })
    }
  }
})

export default handler
