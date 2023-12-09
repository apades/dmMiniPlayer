import type { Props } from '@root/core/danmaku/BarrageSender'
import { DonghuafengBarrageClient } from '@root/danmaku/donghuafeng'
import { dq1 } from '@root/utils'
import WebProvider from './webProvider'

export default class DonghuafengProvider extends WebProvider {
  barrageClient = new DonghuafengBarrageClient()
  onInitBarrageSender(): Omit<Props, 'textInput'> {
    return {
      webTextInput: dq1('.danmu-text'),
      webSendButton: dq1('.danmu-send_btn'),
    }
  }
}
