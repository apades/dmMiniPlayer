import { sendToBackground } from '@plasmohq/messaging'
const bgFetch = (
  url: string,
  options?: RequestInit & {
    /**默认json */
    type?: 'json' | 'text' | 'blob'
  }
) => {
  return sendToBackground({
    name: 'bgFetch',
    body: {
      url,
      options,
    },
  }) as Promise<any>
}

export default bgFetch
