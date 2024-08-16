import { FC, useContext, useEffect, useState } from 'react'
import vpContext from './context'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import Dropdown from '../Dropdown'
import classNames from 'classnames'

const PlaybackRateSelection: FC = (props) => {
  const { webVideo } = useContext(vpContext)
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
    webVideo
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

  const menu = (
    <div className="w-[60px] bg-[#000] rounded-[4px] p-[4px] flex-col gap-[4px] text-[14px] text-white">
      {[0.5, 1, 2, 3].map((rate) => {
        return (
          <div
            key={rate}
            className={classNames(
              'h-[24px] px-[4px] rounded-[4px] text-ellipsis text-center cursor-pointer hover:bg-gray-800 w-full transition-colors whitespace-nowrap overflow-hidden leading-[24px]',
              rate === playbackRate && 'text-[var(--color-main)]'
            )}
            onClick={() => {
              handleChangePlaybackRate(rate)
            }}
          >
            {rate.toFixed(1)}x
          </div>
        )
      })}
    </div>
  )

  return (
    <Dropdown menuRender={() => menu}>
      <div
        className="p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors"
        onClick={() => {
          if (playbackRate === 1) {
            handleChangePlaybackRate(lastPlaybackRate)
          } else {
            handleChangePlaybackRate(1)
          }
        }}
      >
        {playbackRate.toFixed(1)}x
      </div>
    </Dropdown>
  )
}

export default PlaybackRateSelection
