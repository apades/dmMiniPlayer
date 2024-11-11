import { createElement, throttle } from '@root/utils'

import FloatButton from '@root/components/FloatButton'
import { getTopParentsWithSameRect } from '@root/utils/dom'
import { createRoot } from 'react-dom/client'
import { getBrowserSyncStorage } from '@root/utils/storage'
import { DRAG_POS } from '@root/shared/storeKey'

const INIT_ATTR = 'rc-f-init'
async function _initVideoFloatBtn(
  container: HTMLElement,
  vel: HTMLVideoElement,
  fixedPos?: boolean
) {
  if (container == vel) container = container.parentElement!
  if (container.getAttribute(INIT_ATTR) === 'true') return
  // 这里有时候docPIP莫名其妙的会被附加floatBtn，然而docPIP并不会加载这个脚本，很奇怪
  if (container.ownerDocument != document) return

  container.setAttribute(INIT_ATTR, 'true')

  const initPos = await getBrowserSyncStorage(DRAG_POS)
  const reactRoot = createElement('div')
  createRoot(reactRoot).render(
    <FloatButton
      fixedPos={fixedPos}
      container={container}
      vel={vel}
      initPos={{
        x: initPos?.x || 0,
        y: initPos?.y || 0,
      }}
    />
  )
}

function initVideoFloatBtn(videoTarget: HTMLVideoElement) {
  // 有些视频播放器移动鼠标的target并不会在video上，而是在另一个覆盖了容器的子dom上
  // 这里是为了选到跟video大小相同的最外层容器，以该容器移动鼠标触发浮动按钮
  const topParents = getTopParentsWithSameRect(videoTarget)
  const topParentWithPosition = topParents.findLast(
    (el) =>
      ((el?.computedStyleMap?.()?.get?.('position') as any)?.value ?? '') !=
      'static'
  )

  // 所有父容器都没有position属性的，创建的浮动按钮要根据视频位置调整fixed pos
  if (!topParentWithPosition) {
    // 也有单标签的video的，container就用videoTarget.parentElement
    const container =
      topParents[topParents.length - 1] ?? videoTarget.parentElement
    return _initVideoFloatBtn(container, videoTarget, true)
  }
  if (topParentWithPosition instanceof HTMLVideoElement) {
    // console.log('top的', topParentWithPosition)
    return _initVideoFloatBtn(topParentWithPosition, topParentWithPosition)
  }
  return _initVideoFloatBtn(topParentWithPosition, videoTarget)
}

const handleMousemove = throttle((e: MouseEvent) => {
  const _target = e.target as HTMLElement
  // twitch有一个很奇怪的coverEl，mousemove时target是coverEl，导致永远query不到videoEl
  // document
  //    └─同大小的top container
  //       ├─videoEl
  //       └─coverEl
  const target = getTopParentsWithSameRect(_target).pop()
  if (!target) return

  const videoTarget =
    target instanceof HTMLVideoElement ? target : target.querySelector('video')

  if (!videoTarget) return
  initVideoFloatBtn(videoTarget)
}, 1000)

window.addEventListener('mousemove', handleMousemove)
