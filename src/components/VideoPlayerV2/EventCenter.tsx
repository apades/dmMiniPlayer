import { type FC, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'
import vpContext from './context'

const EventCenter: FC = (props) => {
  const { webVideo } = useContext(vpContext)

  useEffect(() => {
    if (!webVideo) return
    const handleRateChange = () => {
      toast(`${webVideo.playbackRate}x`)
    }
    webVideo.addEventListener('ratechange', handleRateChange)
    return () => {
      webVideo.removeEventListener('ratechange', handleRateChange)
    }
  }, [webVideo])

  return <></>
}

export default EventCenter
