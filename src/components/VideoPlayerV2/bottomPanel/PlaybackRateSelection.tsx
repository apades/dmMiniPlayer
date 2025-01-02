import { FC, useContext, useEffect, useState } from 'react'
import vpContext from '../context'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import Dropdown from '../../Dropdown'
import classNames from 'classnames'
import { useKeydown } from '../hooks'

const PlaybackRateSelection: FC = (props) => {
  const { webVideo, isLive } = useContext(vpContext)
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

  const handleTogglePlaybackRate = () => {
    if (playbackRate === 1) {
      handleChangePlaybackRate(lastPlaybackRate)
    } else {
      handleChangePlaybackRate(1)
    }
  }

  useKeydown((key) => {
    if (!webVideo) return
    switch (key) {
      case '-':
        webVideo.playbackRate -= 0.25
        break
      case '+':
        webVideo.playbackRate += 0.25
        break
      case '0':
        handleTogglePlaybackRate()
        break
    }
  })

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
      <div
        className="p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors leading-[18px]"
        onClick={handleTogglePlaybackRate}
      >
        {playbackRate.toFixed(1)}x
      </div>
    </Dropdown>
  )
}

export default PlaybackRateSelection
