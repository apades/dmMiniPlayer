import { useOnce } from '@root/hook'
import { createElement } from '@root/utils'
import {
  getMediaStreamInGetter,
  sendMediaStreamInSender,
} from '@root/utils/webRTC'
import { type FC, useRef } from 'react'
import { createRoot } from 'react-dom/client'

const App: FC = (props) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div>
      <p>iframe</p>
      <button
        onClick={() => {
          const video = videoRef.current
          if (!video) return

          const stream = video.captureStream()
          const { mediaStream, unMount } = sendMediaStreamInSender({ stream })
        }}
      >
        start capture
      </button>
      <video
        ref={videoRef}
        muted
        width={300}
        src="/sample-mp4-file.mp4"
        controls
      />
    </div>
  )
}

const root = createElement('div')

document.body.appendChild(root)
createRoot(root).render(<App />)
