import PostMessageEvent from '@root/shared/postMessageEvent'
import configStore from '@root/store/config'
import {
  addEventListener,
  canAccessTop,
  createElement,
  getVideoElInitFloatButtonData,
} from '@root/utils'
import { getDomAbsolutePosition } from '@root/utils/dom'
import { postStartPIPDataMsg } from '@root/utils/pip'
import { postMessageToTop } from '@root/utils/windowMessages'
import { useState } from 'react'
import useTargetEventListener from './useTargetEventListener'
import { useOnce } from '.'

let hasInit = false
let activeVideoEl: HTMLVideoElement | undefined
let observer: IntersectionObserver | undefined

const canRun = canAccessTop()
if (canRun && !hasInit) {
  observer = new IntersectionObserver(([entry]) => {
    if (!configStore.autoPIP_inScrollToInvisible) return
    const scrollInInvisible = !entry.isIntersecting
    const videoEl = entry.target as HTMLVideoElement

    if (window.provider?.active) return
    if (videoEl.muted || videoEl.paused) return
    if (scrollInInvisible) {
      startPIP(configStore.docPIP_renderType, videoEl, 'scrollOut')
    }
  })

  document.addEventListener('visibilitychange', () => {
    const isHidden = document.visibilityState === 'hidden'

    if (!configStore.autoPIP_inPageHide) return
    if (window.provider?.active) return
    if (!activeVideoEl) return
    if (!isHidden) return
    if (activeVideoEl.muted || activeVideoEl.paused) return
    startPIP(configStore.docPIP_renderType, activeVideoEl, 'tabHidden')
  })

  hasInit = true
}

const observeVideo = (videoEl: HTMLVideoElement) => {
  if (window.provider?.active) return
  if (videoEl.muted) return
  if (!observer) return
  if (activeVideoEl === videoEl) return
  if (activeVideoEl) observer.unobserve(activeVideoEl)
  observer.observe(videoEl)
  activeVideoEl = videoEl
}

const startPIP = async (
  ...args: [
    ...Parameters<typeof postStartPIPDataMsg>,
    type: 'scrollOut' | 'tabHidden',
  ]
) => {
  postStartPIPDataMsg(args[0], args[1])

  // 返回原位置时触发关闭docPIP
  if (configStore.autoPIP_closeInReturnToOriginPos) {
    const type = args[2]
    const [container, vel, isFixed] = getVideoElInitFloatButtonData(args[1])
    const velTop = getDomAbsolutePosition(vel).top
    const { left, top } = vel.getBoundingClientRect()

    // 监听vTopEl和vBottomEl都进入视窗，则判断为返回原位置
    const vTopEl = createElement('div', {
      style: {
        position: isFixed ? 'fixed' : 'absolute',
        top: isFixed ? top : 0,
        left: isFixed ? left : undefined,
      },
    })
    const vBottomEl = createElement('div', {
      style: {
        position: isFixed ? 'fixed' : 'absolute',
        [isFixed ? 'top' : 'bottom']: isFixed ? top + vel.offsetHeight : 0,
        left: isFixed ? left : undefined,
      },
    })

    console.log('vTop vBottom container', container)
    container.appendChild(vTopEl)
    container.appendChild(vBottomEl)

    switch (type) {
      case 'scrollOut': {
        const now = new Date().getTime()

        const inters = new Map([
          [vTopEl, false],
          [vBottomEl, false],
        ])
        const observer = new IntersectionObserver((entries) => {
          if (document.visibilityState === 'hidden') return

          entries.forEach((entry) => {
            inters.set(entry.target as HTMLDivElement, entry.isIntersecting)
            if (inters.get(vTopEl) && inters.get(vBottomEl)) {
              observer.disconnect()

              // 由于b站有下滚自动小窗，跟此功能冲突，用scroll来触发
              if (now - new Date().getTime() < 1000) {
                if (type === 'scrollOut') {
                  const unListenScroll = addEventListener(window, (window) => {
                    window.addEventListener('scroll', () => {
                      if (window.scrollY <= velTop) {
                        postMessageToTop(PostMessageEvent.closeDocPIP, {
                          type: 'autoPIP_closeInReturnToOriginPos',
                        })
                        unListenScroll()
                      }
                    })
                  })
                }
                return
              }

              postMessageToTop(PostMessageEvent.closeDocPIP, {
                type: 'autoPIP_closeInReturnToOriginPos',
              })
            }
          })
        })
        observer.observe(vTopEl)
        observer.observe(vBottomEl)
        break
      }
      case 'tabHidden': {
        const unListenVisibleChange = addEventListener(document, (document) => {
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') return
            postMessageToTop(PostMessageEvent.closeDocPIP, {
              type: 'autoPIP_closeInReturnToOriginPos',
            })
            console.log('show')
            unListenVisibleChange()
          })
        })
        break
      }
    }
  }
}

export default function useAutoPIPHandler(videoEl: HTMLVideoElement) {
  const [canRun] = useState(() => canAccessTop())

  useOnce(() => {
    if (!canRun) return
    if (!videoEl.muted && !videoEl.paused) observeVideo(videoEl)
  })

  useTargetEventListener(
    'play',
    () => {
      if (!canRun) return
      videoEl.addEventListener('play', () => {
        observeVideo(videoEl)
      })
      videoEl.addEventListener('volumechange', () => {
        observeVideo(videoEl)
      })
    },
    videoEl,
  )
}
