import { FC, useContext, useEffect, useState } from 'react'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import vpContext from '../context'
import { useTogglePlayState } from '../hooks'
import Iconfont from '../../Iconfont'

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
      <div
        className="p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors -ml-1"
        onClick={() => togglePlayState()}
      >
        <Iconfont
          type={isPlaying ? 'iconicon_player_pause' : 'iconicon_player_play'}
        />
      </div>
    </>
  )
}

export default TogglePlayActionButton
