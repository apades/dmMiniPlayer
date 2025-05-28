import {
  createElement,
  getVideoElInitFloatButtonData,
  throttle,
} from '@root/utils'

import FloatButton from '@root/components/FloatButton'
import { DRAG_POS } from '@root/shared/storeKey'
import { dqParents, getTopParentsWithSameRect } from '@root/utils/dom'
import { getBrowserSyncStorage } from '@root/utils/storage'
import { createRoot } from 'react-dom/client'

const INIT_ATTR = 'rc-f-init'
async function initVideoFloatBtn(
  container: HTMLElement,
  vel: HTMLVideoElement,
  fixedPos?: boolean,
) {
  if (container === vel) container = container.parentElement!
  if (container.getAttribute(INIT_ATTR) === 'true') return
  // 这里有时候docPIP莫名其妙的会被附加floatBtn，然而docPIP并不会加载这个脚本，很奇怪
  if (container.ownerDocument !== document) return

  container.setAttribute(INIT_ATTR, 'true')

  // fixed会受到 transform、perspective、filter 或 backdrop-filter 影响上下文
  // @see https://developer.mozilla.org/zh-CN/docs/Web/CSS/position#fixed
  if (fixedPos) {
    const els = [vel, ...dqParents(vel, '*')]
    const hasSpcStyle = !!els.find((el) => {
      const style = getComputedStyle(el)

      return ['transform', 'perspective', 'filter', 'backdropFilter'].find(
        (prop: any) => style[prop] !== 'none',
      )
    })

    console.log('hasSpcStyle', hasSpcStyle)
    if (hasSpcStyle) fixedPos = false
  }

  console.log('create floatButton', container, vel, fixedPos)
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
    />,
  )
}

const handleMousemove = throttle((e: MouseEvent) => {
  const _target = e.target as HTMLElement
  // twitch有一个很奇怪的coverEl，mousemove时target是coverEl，导致永远query不到videoEl
  // document
  //    └─同大小的top container
  //       ├─videoEl
  //       └─coverEl
  const target = getTopParentsWithSameRect(_target).pop() ?? _target
  if (!target) return

  const videoTarget =
    target instanceof HTMLVideoElement ? target : target.querySelector('video')

  if (!videoTarget) return
  initVideoFloatBtn(...getVideoElInitFloatButtonData(videoTarget))
}, 1000)

window.addEventListener('mousemove', handleMousemove)
