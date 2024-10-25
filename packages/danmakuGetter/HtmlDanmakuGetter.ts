import { dq1 } from '@root/utils'
import { DanmakuGetter } from '.'

type Props = {
  container: HTMLElement
  child: string
  text: string
  isDanmaku?: (child: HTMLElement) => boolean
}
export default abstract class HtmlDanmakuGetter extends DanmakuGetter {
  htmlDanmakuObserver = new MutationObserver((list) => {
    const nodes = list.map((l) => [...l.addedNodes]).flat()
    if (!nodes)
      return console.warn('发生了未知的错误，找不到list[0].addedNodes', list)

    nodes.forEach((node) => {
      if (!this.props || !(node instanceof HTMLElement)) return
      const props = this.props
      const isDanmakuChild = node.matches(props.child)
      if (!isDanmakuChild) return
      const isDanmaku = props?.isDanmaku?.(node) ?? true
      if (!isDanmaku) return
      const text = dq1(props.text, node)?.textContent
      if (!text) return

      this.emit('addDanmakus', [{ color: '#fff', text, type: 'right' }])
    })
  })

  props?: Props
  /**监听web的弹幕，这个是下策方法 */
  startObserveHtmlDanmaku(props: Props) {
    this.props = props
    if (!props.container) return
    this.htmlDanmakuObserver.observe(props.container, {
      childList: true,
    })
  }

  stopObserveHtmlDanmaku() {
    this.htmlDanmakuObserver?.disconnect?.()
  }
}
