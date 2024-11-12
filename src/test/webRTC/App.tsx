import { useOnce } from '@root/hook'
import PostMessageEvent from '@root/shared/postMessageEvent'
import { onPostMessage, postMessageToChild } from '@root/utils/windowMessages'
import { FC, useRef } from 'react'
import { servers } from './env'

const App: FC = (props) => {
  const pc = useRef(new RTCPeerConnection(servers))
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useOnce(() =>
    onPostMessage(PostMessageEvent.webRTC_answer, (data) => {
      console.log('😀 top接收到answer')
      const answer = new RTCSessionDescription(data)
      pc.current.setRemoteDescription(answer)
    })
  )

  useOnce(async () => {
    let hasInit = false
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        postMessageToChild(
          PostMessageEvent.webRTC_candidate,
          JSON.parse(JSON.stringify(event.candidate))
        )
      }
    }
  })

  return (
    <div>
      <button
        onClick={async () => {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          })
          const remoteStream = new MediaStream()

          remoteStream.addTrack(stream.getVideoTracks()[0])
          pc.current.addTrack(remoteStream.getVideoTracks()[0], remoteStream)

          videoRef.current!.srcObject = remoteStream
          videoRef.current?.play()

          const offer = await pc.current.createOffer()
          pc.current.setLocalDescription(offer)
          postMessageToChild(PostMessageEvent.webRTC_offer, offer)
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
