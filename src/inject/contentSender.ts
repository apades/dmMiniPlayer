/**这里面的只能给content的脚本使用 */
import { createMessager } from '@root/utils/Messager'
import { TProtocolMap } from './injectMessagerType'

export const {
  offMessage,
  onMessage,
  onMessageOnce,
  sendMessage,
} = createMessager<TProtocolMap>({
  listenType: 'inject-response',
  sendType: 'inject-request',
})

window.sendMessage = sendMessage
window.onMessage = onMessage
