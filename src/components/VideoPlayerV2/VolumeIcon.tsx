import { PlayerEvent } from '@root/core/event'
import { useOnce } from '@root/hook'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import configStore from '@root/store/config'
import { dq1, minmax } from '@root/utils'
import { FC, useContext, useMemo, useState } from 'react'
import Iconfont from '../Iconfont'
import vpContext from './context'

const VolumeIcon: FC = (props) => {
  const [isVisible, setVisible] = useState(false)
  const [volume, setVolume] = useState(0)
  const { webVideo, eventBus, videoPlayerRef } = useContext(vpContext)

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

  const wheelTarget = useMemo(
    () => dq1('.video-container', videoPlayerRef.current),
    [videoPlayerRef.current],
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
      const newVol = isUp ? video.volume + 0.01 : video.volume - 0.01
      video.volume = minmax(newVol, 0, 1)
      eventBus.emit(PlayerEvent.volumeChanged)
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
        <div className="f-i-center relative gap-2 vp-cover-icon-bg rounded-[8px] px-3 py-1 mb:text-[14px] text-[18px]">
          <Iconfont type="iconicon_player_volume" className="mt-1" />
          <span>{volume}%</span>
        </div>
      </div>
    )
  )
}

export default VolumeIcon
