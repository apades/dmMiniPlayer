import { useOnce } from '@root/hook'
import {
  getMediaStreamInGetter,
  sendMediaStreamInSender,
} from '@root/utils/webRTC'
import { FC, useRef } from 'react'

const App: FC = (props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useOnce(() => {
    const { mediaStream, unMount } = getMediaStreamInGetter()

    setTimeout(() => {
      if (!videoRef.current) return
      videoRef.current.srcObject = mediaStream
      videoRef.current.play()
    }, 0)
    return unMount
  })

  return (
    <div>
      <video ref={videoRef} muted width={300} />
      <iframe
        ref={iframeRef}
        width="100%"
        height="500px"
        src="/webRTC2/iframe.html"
      ></iframe>
    </div>
  )
}

export default App
