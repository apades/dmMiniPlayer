import { createElement, dq1 } from '@root/utils'
import { FC, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { servers } from './env'
import { useOnce } from '@root/hook'
import { onPostMessage, postMessageToTop } from '@root/utils/windowMessages'
import PostMessageEvent from '@root/shared/postMessageEvent'

const App: FC = (props) => {
  const pc = useRef(new RTCPeerConnection(servers))
  const videoRef = useRef<HTMLVideoElement>(null)

  useOnce(() =>
    onPostMessage(PostMessageEvent.webRTC_offer, async (data) => {
      pc.current.setRemoteDescription(new RTCSessionDescription(data))

      const answer = await pc.current.createAnswer()
      await pc.current.setLocalDescription(answer)
      postMessageToTop(PostMessageEvent.webRTC_answer, answer)
    })
  )

  useOnce(() =>
    onPostMessage(PostMessageEvent.webRTC_candidate, (data) => {
      pc.current.addIceCandidate(new RTCIceCandidate(data))
    })
  )

  useOnce(() => {
    const remoteStream = new MediaStream()

    pc.current.ontrack = (event) => {
      remoteStream.addTrack(event.track)
      videoRef.current?.play()
    }

    if (!videoRef.current) return
    videoRef.current.srcObject = remoteStream
  })

  return (
    <div>
      <p>iframe</p>
      <video ref={videoRef} width={300} />
    </div>
  )
}

const root = createElement('div')

document.body.appendChild(root)
createRoot(root).render(<App />)
