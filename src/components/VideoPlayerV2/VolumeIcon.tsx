import { PlayerEvent } from '@root/core/event'
import { useOnce } from '@root/hook'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import configStore from '@root/store/config'
import { dq1, minmax, onceCallWithMap } from '@root/utils'
import { useMemoizedFn, useUnmount } from 'ahooks'
import { FC, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { t } from '@root/utils/i18n'
import Iconfont from '../Iconfont'
import vpContext from './context'

const getMediaSource = onceCallWithMap(
  (audioContext: AudioContext, videoEl: HTMLVideoElement) => {
    const source = audioContext.createMediaElementSource(videoEl)
    return source
  },
)

const VolumeIcon: FC = (props) => {
  const [isVisible, setVisible] = useState(false)
  const [volume, setVolume] = useState(0)
  const { webVideo, eventBus, videoPlayerRef } = useContext(vpContext)
  const uncappedLockRef = useRef(true)

  const [audioContext] = useState<AudioContext>(() => {
    if (!window.audioContext) {
      window.audioContext = new AudioContext()
    }

    return window.audioContext
  })
  const gainNodeRef = useRef<GainNode>(null)

  const { run: updateUncappedLock } = useDebounceTimeoutCallback(() => {
    if (!webVideo) return
    uncappedLockRef.current = webVideo.volume < 1
  }, 250)
  const { run } = useDebounceTimeoutCallback(() => setVisible(false), 800)

  useOnce(() =>
    eventBus.on2(PlayerEvent.volumeChanged, () => {
      run(() => setVisible(true))
    }),
  )
  useOnce(() =>
    eventBus.on(PlayerEvent.command_volumeUp, () => {
      eventBus.emit(PlayerEvent.volumeChanged)
    }),
  )
  useOnce(() =>
    eventBus.on(PlayerEvent.command_volumeDown, () => {
      eventBus.emit(PlayerEvent.volumeChanged)
    }),
  )

  useEffect(() => {
    if (!webVideo) return
    setVolume(webVideo.volume * 100)
  }, [webVideo])

  const getUpdateUncappedVolumeNode = useMemoizedFn(() => {
    if (gainNodeRef.current) return gainNodeRef.current
    if (!webVideo) return
    const source = getMediaSource(audioContext, webVideo)
    const gainNode = audioContext.createGain()
    source.connect(gainNode)
    gainNode.connect(audioContext.destination)
    gainNodeRef.current = gainNode
    return gainNode
  })

  const updateVolume = useMemoizedFn((add: number) => {
    if (!webVideo) return
    // 突破上音量上限
    if (
      webVideo.volume === 1 &&
      !uncappedLockRef.current &&
      ((volume >= 100 && add > 0) || (volume > 100 && add < 0))
    ) {
      const node = getUpdateUncappedVolumeNode()
      if (!node) return
      let newVol = volume / 100 + add
      node.gain.value = newVol
      setVolume(Math.round(newVol * 100))
      eventBus.emit(PlayerEvent.volumeChanged)
      return
    }

    let newVol = webVideo.volume + add
    newVol = minmax(newVol, 0, 1)
    webVideo.volume = newVol
    updateUncappedLock()
    eventBus.emit(PlayerEvent.volumeChanged)
  })

  // 释放audioContext
  useUnmount(async () => {
    if (!webVideo) return
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect(audioContext.destination)
      const source = getMediaSource(audioContext, webVideo)
      source.connect(audioContext.destination)
    }
    // await audioContext.resume()
    // audioContext.close()
  })

  useOnce(() =>
    eventBus.on2(PlayerEvent.command_volumeUp, () => {
      if (!webVideo) return
      updateVolume(0.1)
    }),
  )
  useOnce(() =>
    eventBus.on2(PlayerEvent.command_volumeDown, () => {
      if (!webVideo) return
      updateVolume(-0.1)
    }),
  )

  const wheelTarget = useMemo(
    () => dq1('.video-container', videoPlayerRef.current),
    [videoPlayerRef],
  )
  useTargetEventListener(
    'wheel',
    (e) => {
      if (configStore.disable_scrollToChangeVolume) return
      const isUp = e.deltaY < 0
      const video = webVideo
      if (!video) return
      e.stopPropagation()
      e.preventDefault()
      updateVolume(isUp ? 0.01 : -0.01)
    },
    wheelTarget,
  )

  useTargetEventListener(
    'volumechange',
    () => {
      if (!webVideo) return
      let newVolume = Math.floor(webVideo.muted ? 0 : webVideo.volume * 100)
      newVolume = minmax(newVolume, 0, 100)
      setVolume(newVolume)
      eventBus.emit(PlayerEvent.volumeChanged)
    },
    webVideo,
  )

  return (
    isVisible && (
      <div className="z-10 ab-center pointer-events-none">
        <div className="relative vp-cover-icon-bg rounded-[8px] px-3 py-1 mb:text-[14px] text-[18px]">
          <div className="f-i-center gap-2 justify-center">
            <Iconfont type="iconicon_player_volume" className="mt-1" />
            <span>{volume}%</span>
          </div>
          {volume === 100 && (
            <div className="text-[12px]">{t('vp.pressToUncappedVolume')}</div>
          )}
        </div>
      </div>
    )
  )
}

export default VolumeIcon
