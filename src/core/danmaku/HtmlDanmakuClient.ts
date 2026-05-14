import { dq1 } from '@root/utils'
import { Omit } from '@root/utils/typeUtils'
import { DanmakuInitData } from './DanmakuEngine'
import LiveDanmakuClient from './LiveDanmakuClient'

type StartObserveHtmlDanmakuProps = {
  container: HTMLElement
  child: string
  text: string
  isDanmu?: (child: HTMLElement) => boolean
}
export default abstract class HtmlDanmakuClient extends LiveDanmakuClient {
  abstract getObserveHtmlDanmakuConfig(): Omit<
    StartObserveHtmlDanmakuProps,
    'isDanmu'
  >

  htmlDanmakuObserver?: MutationObserver

  protected startObserveHtmlDanmaku(props: StartObserveHtmlDanmakuProps) {
    if (!props.container) return
    this.htmlDanmakuObserver = new MutationObserver((list) => {
      const nodes = list.map((l) => [...l.addedNodes]).flat()
      // console.log('nodes', list.length, nodes)
      if (!nodes)
        return console.warn('发生了未知的错误，找不到list[0].addedNodes', list)

      nodes.forEach((_node) => {
        const node = _node as HTMLElement

        const isDanmuChild = node.matches(props.child)
        if (!isDanmuChild) return
        const isDanmu = props?.isDanmu?.(node) ?? true
        if (!isDanmu) return
        const text = dq1(props.text, node)?.textContent
        // console.log('text', text)
        if (!text) return

        this.onGettingLiveDanmakuData(node)
      })
    })
    this.htmlDanmakuObserver.observe(props.container, {
      childList: true,
    })
  }

  override close(): void {
    this.htmlDanmakuObserver?.disconnect?.()
  }
}
