import { FC, useContext, useEffect, useState } from 'react'
import vpContext from './context'
import { useTogglePlayState } from './hooks'
import Iconfont from '../Iconfont'
import useTargetEventListener from '@root/hook/useTargetEventListener'

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
    webVideo
  )
  useTargetEventListener(
    'pause',
    () => {
      if (!webVideo) return
      setPlaying(false)
    },
    webVideo
  )

  const togglePlayState = useTogglePlayState()

  if (isLive)
    return <span className="live-dot wh-[12px] bg-red-700 rounded-full"></span>
  return (
    <div
      className="p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors -ml-1"
      onClick={() => togglePlayState()}
    >
      <Iconfont
        type={isPlaying ? 'iconicon_player_pause' : 'iconicon_player_play'}
      />
    </div>
  )
}

export default TogglePlayActionButton
