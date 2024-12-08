import { useContext, useEffect } from 'react'
import vpContext from './context'
import { minmax, ownerWindow } from '@root/utils'
import configStore from '@root/store/config'
import { PlayerEvent } from '@root/core/event'
import useTargetEventListener from '@root/hook/useTargetEventListener'

export const useTogglePlayState = () => {
  const { webVideo, isLive } = useContext(vpContext)

  const togglePlayState = async (type?: 'play' | 'pause') => {
    if (isLive) return
    if (!webVideo) return
    // 第一次进来没有can-pause attr，忽略判断能否pause
    const canPauseAttr = webVideo.getAttribute('can-pause')
    const canPause = canPauseAttr ? canPauseAttr == 'true' : true

    if ((!webVideo.paused || type === 'pause') && canPause && type !== 'play') {
      webVideo.pause()
    } else {
      webVideo.setAttribute('can-pause', 'false')
      if (webVideo.currentTime === webVideo.duration) {
        webVideo.currentTime = 0
      }
      return webVideo
        .play()
        .then(() => {
          webVideo.setAttribute('can-pause', 'true')
          if (type === 'pause') webVideo.pause()
        })
        .catch((err) => {
          console.error('播放出错', err)
          throw err
        })
    }
  }

  return togglePlayState
}

/**监听docPIP全局键盘 */
export const useInWindowKeydown = (onKeydown?: (e: KeyboardEvent) => void) => {
  const { webVideo, eventBus, isLive, keydownWindow } = useContext(vpContext)
  const togglePlayState = useTogglePlayState()

  useEffect(() => {
    if (!keydownWindow) return
    let speedModeTimer: NodeJS.Timeout | null,
      isSpeedMode = false
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!webVideo) return
      // TODO 以后尽量把e.target去掉，因为shadowRoot下接收到冒泡的event.target是shadowRoot，不会是keydown实际的target😅
      // ? 或者搞个polyfill，支持shadowRoot的event通过一层转发。但会导致isTrusted:false
      const tar = e.target as HTMLElement
      if (
        tar.tagName === 'TEXTAREA' ||
        tar.tagName === 'INPUT' ||
        tar.contentEditable === 'true'
      )
        return
      onKeydown?.(e)
      switch (e.code) {
        case 'ArrowDown': {
          e.preventDefault()
          const v = webVideo.volume
          webVideo.volume = v - 0.1 >= 0 ? v - 0.1 : 0
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const v = webVideo.volume
          webVideo.volume = v + 0.1 <= 1 ? v + 0.1 : 1
          break
        }
        case 'ArrowLeft': {
          if (isLive) return
          e.preventDefault()
          let getNewTime = () =>
            minmax(webVideo.currentTime - 5, 0, webVideo.duration)

          if (webVideo.paused) {
            togglePlayState('play').then(() => {
              webVideo.currentTime = getNewTime()
            })
          } else {
            webVideo.currentTime = getNewTime()
          }
          break
        }
        case 'ArrowRight': {
          if (isLive) return
          if (speedModeTimer) return
          speedModeTimer = setTimeout(() => {
            isSpeedMode = true
            webVideo.playbackRate = configStore.playbackRate
            eventBus.emit(PlayerEvent.longTabPlaybackRate)
          }, 200)
          break
        }
        case 'Space':
          if (isLive) return
          e.preventDefault()
          togglePlayState()

          break
      }
    }
    keydownWindow.addEventListener('keydown', handleKeyDown)
    // 这是给replacer模式监听的，keydown keyup已经被阻止了，通过一层代理转发和监听
    const handleKeyDownCustom = (e: KeyboardEvent) => {
      const detail = e.detail
      handleKeyDown(detail as any)
    }
    keydownWindow.addEventListener('dm-keydown' as any, handleKeyDownCustom)

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!webVideo) return
      const tar = e.target as HTMLElement
      if (
        tar.tagName === 'TEXTAREA' ||
        tar.tagName === 'INPUT' ||
        tar.contentEditable === 'true'
      )
        return
      e.stopPropagation()

      switch (e.code) {
        case 'ArrowRight': {
          if (isLive) return
          e.preventDefault()
          if (speedModeTimer) {
            clearTimeout(speedModeTimer)
          }

          speedModeTimer = null
          // https://github.com/apades/dmMiniPlayer/issues/9
          // eslint-disable-next-line no-self-assign
          webVideo.currentTime = webVideo.currentTime
          // const onSeeked = () => {
          //   eventBus.emit(PlayerEvent.longTabPlaybackRateEnd)
          //   webVideo.removeEventListener('seeked', onSeeked)
          // }
          // webVideo.addEventListener('seeked', onSeeked)
          setTimeout(() => {
            eventBus.emit(PlayerEvent.longTabPlaybackRateEnd)
          }, 0)

          if (isSpeedMode) {
            webVideo.playbackRate = 1
            isSpeedMode = false
          } else {
            const getNewTime = () =>
              minmax(webVideo.currentTime + 5, 0, webVideo.duration)

            if (webVideo.paused) {
              togglePlayState('play').then(() => {
                webVideo.currentTime = getNewTime()
              })
            } else {
              webVideo.currentTime = getNewTime()
            }
          }
        }
      }
    }
    keydownWindow.addEventListener('keyup', handleKeyUp)
    const handleKeyUpCustom = (e: KeyboardEvent) => {
      const detail = e.detail
      handleKeyUp(detail as any)
    }
    keydownWindow.addEventListener('dm-keyup' as any, handleKeyUpCustom)

    return () => {
      keydownWindow.removeEventListener('keydown', handleKeyDown)
      keydownWindow.removeEventListener('keyup', handleKeyUp)

      keydownWindow.addEventListener('dm-keydown' as any, handleKeyDownCustom)
      keydownWindow.addEventListener('dm-keyup' as any, handleKeyUpCustom)
    }
  }, [keydownWindow, isLive])
}

export const useWebVideoEventsInit = () => {
  const { webVideo, eventBus } = useContext(vpContext)

  useTargetEventListener(
    'seeked',
    () => eventBus.emit(PlayerEvent.seeked),
    webVideo
  )
  useTargetEventListener(
    'play',
    () => eventBus.emit(PlayerEvent.play),
    webVideo
  )
  useTargetEventListener(
    'pause',
    () => eventBus.emit(PlayerEvent.pause),
    webVideo
  )
}
