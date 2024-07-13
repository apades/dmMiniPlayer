import { dq1 } from '@root/utils'
import { HtmlDanmakuGetter } from '../'

export default class Twitch extends HtmlDanmakuGetter {
  onInit = () => {
    this.startObserveHtmlDanmaku({
      container: dq1('.chat-scrollable-area__message-container'),
      child: '.chat-line__message',
      text: '.chat-line__message-container .chat-line__username-container ~ span:last-of-type',
    })
  }
  onUnload = () => {
    this.stopObserveHtmlDanmaku()
  }
}
