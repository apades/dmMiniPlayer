import { dq1 } from '@root/utils'
import { HtmlDanmakuProvider, WebProvider } from '@root/core/WebProvider'
import YoutubeSubtitleManager from './SubtitleManager'
import onRouteChange from '@root/inject/csUtils/onRouteChange'

const getIframe = () => dq1<HTMLIFrameElement>('.ytd-live-chat-frame')
const isLive = () => !!getIframe()

export default class YoutubeProvider extends HtmlDanmakuProvider {
  onInit() {
    this.isLive = isLive()
    if (this.isLive) {
      return super.onInit()
    }

    this.subtitleManager = new YoutubeSubtitleManager()
    this.addOnUnloadFn(
      onRouteChange(() => {
        this.subtitleManager.init(this.webVideo)
      })
    )
  }

  getObserveHtmlDanmakuConfig() {
    return {
      container: dq1<HTMLElement>(
        '#items.yt-live-chat-item-list-renderer',
        getIframe()?.contentDocument
      )!,
      child: 'yt-live-chat-text-message-renderer',
      text: '#message',
    }
  }
  getDanmakuSenderConfig() {
    const dqTar = getIframe()?.contentDocument
    return {
      webTextInput: dq1<HTMLInputElement>(
        '#input.yt-live-chat-text-input-field-renderer',
        dqTar
      ),
      webSendButton: dq1(
        '.yt-live-chat-message-input-renderer .yt-spec-button-shape-next',
        dqTar
      ),
    }
  }
}
