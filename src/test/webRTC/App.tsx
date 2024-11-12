import { sendMediaStreamInSender } from '@root/utils/webRTC'
import { FC, useRef } from 'react'

const App: FC = (props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div>
      <button
        onClick={async () => {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          })

          const { mediaStream, unMount } = sendMediaStreamInSender({
            stream,
            target: iframeRef.current?.contentWindow as Window,
          })

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
            videoRef.current.play()
          }
        }}
      >
        start record
      </button>
      <video ref={videoRef} width={300} />
      <iframe
        ref={iframeRef}
        width="100%"
        height="500px"
        src="/webRTC/iframe.html"
      ></iframe>
    </div>
  )
}

export default App
