import { HtmlDanmakuProvider } from '@root/core/WebProvider'
import { dq1 } from '@root/utils'

export default class TwitchProvider extends HtmlDanmakuProvider {
  isLive = true
  getObserveHtmlDanmakuConfig() {
    const liveParent = dq1<HTMLDivElement>(
      '.chat-scrollable-area__message-container',
    )!

    if (liveParent)
      return {
        container: liveParent,
        child: '*',
        text: '.chat-line__message-container .chat-line__username-container ~ span:last-of-type',
      }

    return {
      container: dq1('.video-chat__message-list-wrapper ul')!,
      child: '*',
      text: '[data-a-target="chat-message-text"]',
    }
  }
  getDanmakuSenderConfig() {
    return {
      webTextInput: dq1<HTMLInputElement>('[data-a-target="chat-input"]')!,
      webSendButton: dq1('[data-a-target="chat-send-button"]')!,
    }
  }
}
