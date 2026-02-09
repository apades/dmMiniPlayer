import { useContext, useEffect } from 'react'
import { isDocPIP, minmax, ownerWindow } from '@root/utils'
import configStore from '@root/store/config'
import { PlayerEvent } from '@root/core/event'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { Key, keyCodeToCode, keyToKeyCodeMap } from '@root/types/key'
import { isFunction, isString } from 'lodash-es'
import vpContext from './context'

export const useTogglePlayState = () => {
  const { webVideo, isLive } = useContext(vpContext)

  const togglePlayState = async (type?: 'play' | 'pause') => {
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
export const useInWindowKeydown = () => {
  const { webVideo, eventBus, isLive, keydownWindow, keyBinding } =
    useContext(vpContext)
  const togglePlayState = useTogglePlayState()

  useEffect(() => {
    if (!keydownWindow) return

    const oneFrame = 1 / 60
    let beforeLongPressSpeedModePlaybackRate: number = 1
    const callbackFns = [
      eventBus.on2(PlayerEvent.command_rewind, () => {
        if (!webVideo) return
        if (isLive) return
        let getNewTime = () =>
          minmax(webVideo.currentTime - 5, 0, webVideo.duration)

        if (webVideo.paused) {
          togglePlayState('play').then(() => {
            webVideo.currentTime = getNewTime()
            eventBus.emit(PlayerEvent.changeCurrentTimeByKeyboard)
          })
        } else {
          webVideo.currentTime = getNewTime()
          eventBus.emit(PlayerEvent.changeCurrentTimeByKeyboard)
        }
      }),
      eventBus.on2(PlayerEvent.command_forward, () => {
        if (!webVideo) return
        if (isLive) return
        const getNewTime = () =>
          minmax(webVideo.currentTime + 5, 0, webVideo.duration)

        if (webVideo.paused) {
          togglePlayState('play').then(() => {
            webVideo.currentTime = getNewTime()
            eventBus.emit(PlayerEvent.changeCurrentTimeByKeyboard)
          })
        } else {
          webVideo.currentTime = getNewTime()
          eventBus.emit(PlayerEvent.changeCurrentTimeByKeyboard)
        }
      }),
      eventBus.on2(PlayerEvent.command_pressSpeedMode, () => {
        if (!webVideo) return
        if (isLive) return
        beforeLongPressSpeedModePlaybackRate = webVideo.playbackRate
        webVideo.playbackRate = configStore.playbackRate
        eventBus.emit(PlayerEvent.longTabPlaybackRate)
      }),
      eventBus.on2(PlayerEvent.command_pressSpeedMode_release, () => {
        if (!webVideo) return
        if (isLive) return
        webVideo.playbackRate = beforeLongPressSpeedModePlaybackRate
        eventBus.emit(PlayerEvent.longTabPlaybackRateEnd)
      }),

      eventBus.on2(PlayerEvent.command_playToggle, () => togglePlayState()),
      eventBus.on2(PlayerEvent.command_fineForward, () => {
        if (!webVideo) return
        const getNewTime = () =>
          minmax(webVideo.currentTime + oneFrame, 0, webVideo.duration)

        webVideo.currentTime = getNewTime()
        eventBus.emit(PlayerEvent.changeCurrentTimeByKeyboard_fine)
      }),
      eventBus.on2(PlayerEvent.command_fineRewind, () => {
        if (!webVideo) return
        const getNewTime = () =>
          minmax(webVideo.currentTime - oneFrame, 0, webVideo.duration)

        webVideo.currentTime = getNewTime()
        eventBus.emit(PlayerEvent.changeCurrentTimeByKeyboard_fine)
      }),
    ]

    return () => {
      callbackFns.forEach((fn) => fn())
    }
  }, [keydownWindow, isLive, webVideo])
}

export function useKeydown(
  onKeydown: (key: Key, e: KeyboardEvent) => void,
): void
export function useKeydown(key: Key, fn: (e: KeyboardEvent) => void): void
export function useKeydown(
  onKeydown: ((key: Key, e: KeyboardEvent) => void) | Key,
  fn?: (e: KeyboardEvent) => void,
) {
  const { webVideo, isLive, keydownWindow } = useContext(vpContext)
  useEffect(() => {
    if (!keydownWindow) return
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
      let keyCode = e.keyCode
      if (isFunction(onKeydown)) {
        onKeydown((keyCodeToCode as any)[keyCode] as Key, e)
      }
      if (isString(onKeydown)) {
        if (keyCode === (keyToKeyCodeMap as any)[onKeydown]) {
          fn?.(e)
        }
      }
    }
    keydownWindow.addEventListener('keydown', handleKeyDown)
    // 这是给replacer模式监听的，keydown keyup已经被阻止了，通过一层代理转发和监听
    const handleKeyDownCustom = (e: KeyboardEvent) => {
      const detail = e.detail
      handleKeyDown(detail as any)
    }
    keydownWindow.addEventListener('dm-keydown' as any, handleKeyDownCustom)

    return () => {
      keydownWindow.removeEventListener('keydown', handleKeyDown)

      keydownWindow.addEventListener('dm-keydown' as any, handleKeyDownCustom)
    }
  }, [keydownWindow, isLive])
}

export const useWebVideoEventsInit = () => {
  const { webVideo, eventBus } = useContext(vpContext)

  useTargetEventListener(
    'seeked',
    () => eventBus.emit(PlayerEvent.seeked),
    webVideo,
  )
  useTargetEventListener(
    'play',
    () => eventBus.emit(PlayerEvent.play),
    webVideo,
  )
  useTargetEventListener(
    'pause',
    () => eventBus.emit(PlayerEvent.pause),
    webVideo,
  )
}
