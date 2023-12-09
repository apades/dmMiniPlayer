import type { Props } from '@root/core/danmaku/BarrageSender'
import CCLiveBarrageClient from '@root/danmaku/cc/liveBarrageClient'
import { dq1 } from '@root/utils'
import WebProvider from './webProvider'

export default class CCLiveProvider extends WebProvider {
  barrageClient = new CCLiveBarrageClient()
  onInitBarrageSender(): Omit<Props, 'textInput'> {
    return {
      webTextInput: dq1('.chat-input'),
      webSendButton: dq1('.send-msg'),
    }
  }
}
