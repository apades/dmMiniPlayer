import { dq1 } from '@root/utils'
import HtmlDanmakuProvider from '../htmlDanmakuProvider'
import type MiniPlayer from '@root/core/miniPlayer'

export default class YoutubeLiveProvider extends HtmlDanmakuProvider {
  iframe: HTMLIFrameElement

  protected initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ): Promise<MiniPlayer> {
    this.iframe = dq1('.ytd-live-chat-frame')
    return super.initMiniPlayer(options)
  }

  getObserveHtmlDanmakuConfig(): Parameters<
    this['startObserveHtmlDanmaku']
  >[0] {
    return {
      container: dq1(
        '#items.yt-live-chat-item-list-renderer',
        this.iframe.contentDocument
      ),
      child: 'yt-live-chat-text-message-renderer',
      text: '#message',
      uname: '.author-name',
    }
  }
  getBarrageSenderConfig(): Parameters<
    this['miniPlayer']['initBarrageSender']
  >[0] {
    return {
      webTextInput: dq1(
        '#input.yt-live-chat-text-input-field-renderer',
        this.iframe.contentDocument
      ),
      webSendButton: dq1(
        '.yt-live-chat-message-input-renderer .yt-spec-button-shape-next',
        this.iframe.contentDocument
      ),
    }
  }
}
