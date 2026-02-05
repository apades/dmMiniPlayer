import { HtmlDanmakuProvider } from '@root/core/WebProvider'
import { dq1 } from '@root/utils'

export default class HuyaProvider extends HtmlDanmakuProvider {
  override isLive = true
  getObserveHtmlDanmakuConfig(): Parameters<
    (typeof this)['startObserveHtmlDanmaku']
  >[0] {
    return {
      container: dq1<HTMLDivElement>('#chat-room__list')!,
      child: '*',
      text: '.msg',
      isDanmu(child) {
        return child.children[0]?.classList.contains('msg-normal')
      },
    }
  }
  getDanmakuSenderConfig() {
    return {
      webTextInput: dq1<HTMLInputElement>('#pub_msg_input')!,
      webSendButton: dq1('#msg_send_bt')!,
    }
  }
}
