/**这里面的只能给content的脚本使用 */
import { createMessager } from '@root/utils/Messager'
import type { TProtocolMap } from './injectMessagerType'

export const { offMessage, onMessage, onMessageOnce, sendMessage } =
  createMessager<TProtocolMap>({
    listenType: 'inject-response',
    sendType: 'inject-request',
  })

type First<T extends any[]> = T[0]
export function runCodeInTopWindow<
  Arg extends any[],
  T extends (...args: Arg) => void,
>(...[fn, args]: First<Arg> extends never ? [T] : [T, Arg]) {
  return sendMessage('run-code', { function: fn.toString(), args })
}

window.sendMessage = sendMessage
window.onMessage = onMessage
