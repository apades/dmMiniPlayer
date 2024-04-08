import { sendMessage } from 'webext-bridge/content-script'

const bgFetch = (
  url: string,
  options?: RequestInit & {
    /**默认json */
    type?: 'json' | 'text' | 'blob'
  }
) => {
  return sendMessage('bgFetch', {
    name: 'bgFetch',
    body: {
      url,
      options,
    } as any,
  }) as Promise<any>
}

export default bgFetch
