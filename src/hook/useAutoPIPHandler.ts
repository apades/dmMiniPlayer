import { addEventListener, canAccessTop } from '@root/utils'
import { useOnce } from '.'
import { useState } from 'react'
import configStore from '@root/store/config'
import { postStartPIPDataMsg } from '@root/components/FloatButton'

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
      postStartPIPDataMsg(configStore.docPIP_renderType, videoEl)
    }
  })

  document.addEventListener('visibilitychange', () => {
    const isHidden = document.visibilityState === 'hidden'

    if (!configStore.autoPIP_inPageHide) return
    if (window.provider?.active) return
    if (!activeVideoEl) return
    if (!isHidden) return
    if (activeVideoEl.muted || activeVideoEl.paused) return
    postStartPIPDataMsg(configStore.docPIP_renderType, activeVideoEl)
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

export default function useAutoPIPHandler(videoEl: HTMLVideoElement) {
  const [canRun] = useState(() => canAccessTop())

  useOnce(() => {
    if (!canRun) return
    if (!videoEl.muted && !videoEl.paused) observeVideo(videoEl)
  })

  useOnce(() =>
    addEventListener(videoEl, (videoEl) => {
      if (!canRun) return
      videoEl.addEventListener('play', () => {
        observeVideo(videoEl)
      })
      videoEl.addEventListener('volumechange', () => {
        observeVideo(videoEl)
      })
    })
  )
}
