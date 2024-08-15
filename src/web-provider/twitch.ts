import { HtmlDanmakuProvider } from '@root/core/WebProvider'
import { dq1 } from '@root/utils'

export default class TwitchProvider extends HtmlDanmakuProvider {
  isLive = true
  getObserveHtmlDanmakuConfig() {
    return {
      container: dq1<HTMLDivElement>(
        '.chat-scrollable-area__message-container'
      )!,
      child: '.chat-line__message',
      text: '.chat-line__message-container .chat-line__username-container ~ span:last-of-type',
    }
  }
  getDanmakuSenderConfig() {
    return {
      webTextInput: dq1<HTMLInputElement>('[data-a-target="chat-input"]')!,
      webSendButton: dq1('[data-a-target="chat-send-button"]')!,
    }
  }
}
