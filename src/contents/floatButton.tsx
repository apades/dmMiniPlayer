import {
  createElement,
  getVideoElInitFloatButtonData,
  throttle,
} from '@root/utils'

import FloatButton from '@root/components/FloatButton'
import { getTopParentsWithSameRect } from '@root/utils/dom'
import { createRoot } from 'react-dom/client'
import { getBrowserSyncStorage } from '@root/utils/storage'
import { DRAG_POS } from '@root/shared/storeKey'

const INIT_ATTR = 'rc-f-init'
async function initVideoFloatBtn(
  container: HTMLElement,
  vel: HTMLVideoElement,
  fixedPos?: boolean,
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
  const target = getTopParentsWithSameRect(_target).pop()
  if (!target) return

  const videoTarget =
    target instanceof HTMLVideoElement ? target : target.querySelector('video')

  if (!videoTarget) return
  initVideoFloatBtn(...getVideoElInitFloatButtonData(videoTarget))
}, 1000)

window.addEventListener('mousemove', handleMousemove)
