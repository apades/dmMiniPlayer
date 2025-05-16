import { createElement, dq1 } from '@root/utils'
import { HtmlVideoPlayer } from '../VideoPlayer/HtmlVideoPlayer'
import DocPIPWebProvider from './DocPIPWebProvider'
import WebProvider from './WebProvider'

class OriginWebPlayer extends HtmlVideoPlayer {
  async onInit(): Promise<void> {}
  async init(props: { webProvider: WebProvider }): Promise<void> {
    if (!(props.webProvider instanceof MoveDomToDocPIPWebProvider)) return
    const query = props.webProvider.getInitData().tarEl
    const el = query instanceof HTMLElement ? query : dq1(query)
    this.playerRootEl = el
  }
}

export default abstract class MoveDomToDocPIPWebProvider extends DocPIPWebProvider {
  protected override MiniPlayer = OriginWebPlayer
  abstract getInitData(): { tarEl: HTMLElement | string }
  getVideoEl(document?: Document): HTMLVideoElement {
    const videoEl = createElement('video')
    const container = createElement('div', {
      children: [videoEl],
    })
    return videoEl
  }

  async onOpenPlayer(): Promise<void> {
    await super.onOpenPlayer()
    const pipWindow = this.pipWindow!
    ;[...document.styleSheets].forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules]
          .map((rule) => rule.cssText)
          .join('')
        const style = document.createElement('style')

        style.textContent = cssRules
        pipWindow.document.head.appendChild(style)
      } catch (e) {
        const link = document.createElement('link')

        link.rel = 'stylesheet'
        link.type = styleSheet.type
        link.media = styleSheet.media as any
        link.href = styleSheet.href!
        pipWindow.document.head.appendChild(link)
      }
    })
  }
}
