import useTargetEventListener from '@root/hook/useTargetEventListener'
import { FC, useContext } from 'react'
import toast from 'react-hot-toast'
import vpContext from './context'

const EventCenter: FC = (props) => {
  const { webVideo } = useContext(vpContext)

  useTargetEventListener(
    'ratechange',
    (e) => {
      if (!webVideo) return
      toast(`${webVideo.playbackRate}x`)
    },
    webVideo,
  )

  return <></>
}

export default EventCenter
