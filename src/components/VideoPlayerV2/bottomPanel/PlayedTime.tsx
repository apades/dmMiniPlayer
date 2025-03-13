import { formatTime } from '@root/utils'
import { FC, useContext, useEffect, useState } from 'react'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import vpContext from '../context'

const PlayedTime: FC = (props) => {
  const { webVideo, isLive } = useContext(vpContext)
  const [currentTime, setCurrentTime] = useState(0)

  useTargetEventListener(
    'timeupdate',
    () => {
      if (!webVideo) return
      setCurrentTime(webVideo.currentTime)
    },
    webVideo,
  )
  useEffect(() => {
    if (!webVideo) return
    setCurrentTime(webVideo.currentTime)
  }, [webVideo])

  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      {formatTime(currentTime)}
      {!isLive && ` / ${formatTime(webVideo?.duration ?? 0)} `}
    </span>
  )
}

export default PlayedTime
