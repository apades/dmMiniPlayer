import { FC, useContext, useEffect, useState } from 'react'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import classNames from 'classnames'
import { useMemoizedFn } from 'ahooks'
import { useOnce } from '@root/hook'
import { PlayerEvent } from '@root/core/event'
import HiddenAble from '@root/components/HiddenAble'
import Dropdown from '../../Dropdown'
import vpContext from '../context'
import ActionButton from './ActionButton'

const PlaybackRateSelection: FC = (props) => {
  const { webVideo, isLive, eventBus } = useContext(vpContext)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [lastPlaybackRate, setLastPlaybackRate] = useState(3)

  useEffect(() => {
    if (!webVideo) return
    setPlaybackRate(webVideo.playbackRate)
  }, [webVideo])
  useTargetEventListener(
    'ratechange',
    () => {
      if (!webVideo) return
      setPlaybackRate(webVideo.playbackRate)
    },
    webVideo,
  )

  const handleChangePlaybackRate = (rate: number) => {
    if (!webVideo) return
    if (rate == playbackRate) return
    if (playbackRate != 1) {
      setLastPlaybackRate(playbackRate)
    }
    setPlaybackRate(rate)
    webVideo.playbackRate = rate
  }

  const handleTogglePlaybackRate = useMemoizedFn(() => {
    if (playbackRate === 1) {
      handleChangePlaybackRate(lastPlaybackRate)
    } else {
      handleChangePlaybackRate(1)
    }
  })

  useOnce(() =>
    eventBus.on2(PlayerEvent.command_speedDown, () => {
      if (!webVideo || isLive) return
      webVideo.playbackRate -= 0.25
    }),
  )
  useOnce(() =>
    eventBus.on2(PlayerEvent.command_speedUp, () => {
      if (!webVideo || isLive) return
      webVideo.playbackRate += 0.25
    }),
  )
  useOnce(() =>
    eventBus.on2(PlayerEvent.command_speedToggle, () => {
      if (!webVideo || isLive) return
      handleTogglePlaybackRate()
    }),
  )

  const menu = (
    <div className="w-[60px] bg-[#000] rounded-[4px] p-[4px] flex-col gap-[4px] text-[14px] text-white">
      {[0.5, 1, 1.25, 1.5, 2].map((rate) => {
        return (
          <div
            key={rate}
            className={classNames(
              'h-[24px] px-[4px] rounded-[4px] text-ellipsis text-center cursor-pointer hover:bg-gray-800 w-full transition-colors whitespace-nowrap overflow-hidden leading-[24px]',
              rate === playbackRate && 'text-[var(--color-main)]',
            )}
            onClick={() => {
              handleChangePlaybackRate(rate)
            }}
          >
            {rate.toFixed(2)}x
          </div>
        )
      })}
    </div>
  )

  if (isLive) return null
  return (
    <Dropdown menuRender={() => menu}>
      <ActionButton onClick={handleTogglePlaybackRate}>
        {playbackRate.toFixed(2)}x
      </ActionButton>
    </Dropdown>
  )
}

export default PlaybackRateSelection
