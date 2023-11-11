import { dq1 } from '@root/utils'
import HtmlDanmakuProvider from './htmlDanmakuProvider'

export default class TwitchProvider extends HtmlDanmakuProvider {
  getObserveHtmlDanmakuConfig(): Parameters<
    this['startObserveHtmlDanmaku']
  >[0] {
    return {
      container: dq1('.chat-scrollable-area__message-container'),
      child: '.chat-line__message',
      text: '.chat-line__message-container .chat-line__username-container ~ span:last-of-type',
    }
  }
  getBarrageSenderConfig(): Parameters<
    this['miniPlayer']['initBarrageSender']
  >[0] {
    return {
      webTextInput: dq1('[data-a-target="chat-input"]'),
      webSendButton: dq1('[data-a-target="chat-send-button"]'),
    }
  }
}
