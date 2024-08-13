import { useContext, useEffect } from 'react'
import vpContext from './context'
import { minmax } from '@root/utils'
import configStore from '@root/store/config'
import { PlayerEvent } from '@root/core/event'
import useTargetEventListener from '@root/hook/useTargetEventListener'

export const useTogglePlayState = () => {
  const { webVideo } = useContext(vpContext)

  const togglePlayState = async (type?: 'play' | 'pause') => {
    if (!webVideo) return
    const canPause = !!webVideo.getAttribute('can-pause')

    if ((!webVideo.paused || type === 'pause') && canPause && type !== 'play') {
      webVideo.pause()
    } else {
      webVideo.removeAttribute('can-pause')
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
export const useInWindowKeydown = (keydownWindow: Window = window) => {
  const { webVideo, eventBus, isLive } = useContext(vpContext)
  const togglePlayState = useTogglePlayState()

  let speedModeTimer: NodeJS.Timeout,
    isSpeedMode = false

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!webVideo) return
      // if (window.videoPlayers.focusIndex !== index) return
      const tar = e.target as HTMLElement
      if (
        tar.tagName === 'TEXTAREA' ||
        tar.tagName === 'INPUT' ||
        tar.contentEditable === 'true'
      )
        return
      // e.stopPropagation()
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
          clearTimeout(speedModeTimer)
          eventBus.emit(PlayerEvent.longTabPlaybackRateEnd)

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

    return () => {
      keydownWindow.removeEventListener('keydown', handleKeyDown)
      keydownWindow.removeEventListener('keyup', handleKeyUp)
    }
  }, [keydownWindow])
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
