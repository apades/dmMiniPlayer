import { useOnce } from '@root/hook'
import { createElement } from '@root/utils'
import { getMediaStreamInGetter } from '@root/utils/webRTC'
import { type FC, useRef } from 'react'
import { createRoot } from 'react-dom/client'

const App: FC = (props) => {
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
      <p>iframe</p>
      <video ref={videoRef} muted width={300} />
    </div>
  )
}

const root = createElement('div')

document.body.appendChild(root)
createRoot(root).render(<App />)
