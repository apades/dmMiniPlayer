import { FC, useContext, useEffect, useState } from 'react'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import vpContext from '../context'
import { useTogglePlayState } from '../hooks'
import Iconfont from '../../Iconfont'
import ActionButton from './ActionButton'

const TogglePlayActionButton: FC = (props) => {
  const { webVideo, isLive } = useContext(vpContext)
  const [isPlaying, setPlaying] = useState(false)
  useEffect(() => {
    if (webVideo) {
      setPlaying(!webVideo.paused)
    }
  }, [webVideo])

  useTargetEventListener(
    'play',
    () => {
      if (!webVideo) return
      setPlaying(true)
    },
    webVideo,
  )
  useTargetEventListener(
    'pause',
    () => {
      if (!webVideo) return
      setPlaying(false)
    },
    webVideo,
  )

  const togglePlayState = useTogglePlayState()

  return (
    <>
      {isLive && (
        <div className="live-dot wh-[12px] bg-red-700 rounded-full mt-0.5"></div>
      )}
      <ActionButton onClick={() => togglePlayState()} className="-ml-1">
        <Iconfont
          type={isPlaying ? 'iconicon_player_pause' : 'iconicon_player_play'}
        />
      </ActionButton>
    </>
  )
}

export default TogglePlayActionButton
