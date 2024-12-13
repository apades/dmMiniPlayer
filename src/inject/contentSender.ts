/**这里面的只能给content的脚本使用 */
import { createMessager } from '@root/utils/Messager'
import type { TProtocolMap } from './injectMessagerType'

export const { offMessage, onMessage, onMessageOnce, sendMessage } =
  createMessager<TProtocolMap>({
    listenType: 'inject-response',
    sendType: 'inject-request',
  })

// @typescript-eslint/no-unsafe-function-type
export function runCodeInTopWindow<T extends (...args: any) => void>(
  fn: T,
  args: Parameters<T>,
) {
  return sendMessage('run-code', { function: fn.toString(), args })
}

window.sendMessage = sendMessage
window.onMessage = onMessage
