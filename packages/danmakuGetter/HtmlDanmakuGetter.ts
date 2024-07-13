import { dq1 } from '@root/utils'
import { DanmakuGetter } from '.'

export default abstract class HtmlDanmakuGetter extends DanmakuGetter {
  htmlDanmakuObserver: MutationObserver
  /**监听web的弹幕，这个是下策方法 */
  startObserveHtmlDanmaku(props: {
    container: HTMLElement
    child: string
    text: string
    isDanmaku?: (child: HTMLElement) => boolean
  }) {
    if (!props.container) return
    this.htmlDanmakuObserver = new MutationObserver((list) => {
      const nodes = list.map((l) => [...l.addedNodes]).flat()
      if (!nodes)
        return console.warn('发生了未知的错误，找不到list[0].addedNodes', list)

      nodes.forEach((node: HTMLElement) => {
        const isDanmakuChild = node.matches(props.child)
        if (!isDanmakuChild) return
        const isDanmaku = props?.isDanmaku?.(node) ?? true
        if (!isDanmaku) return
        const text = dq1(props.text, node)?.textContent
        if (!text) return

        this.emit('addDanmakus', [{ color: '#fff', text, type: 'right' }])
      })
    })
    this.htmlDanmakuObserver.observe(props.container, {
      childList: true,
    })
  }

  stopObserveHtmlDanmaku() {
    this.htmlDanmakuObserver?.disconnect?.()
  }
}
