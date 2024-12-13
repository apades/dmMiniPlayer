import WebextEvent from '@root/shared/webextEvent'
import { sendMessage } from 'webext-bridge/content-script'

const bgFetch = (
  url: string,
  options?: RequestInit & {
    /**默认json */
    type?: 'json' | 'text' | 'blob'
  },
) => {
  return sendMessage(WebextEvent.bgFetch, {
    url,
    options,
  })
}

export default bgFetch
