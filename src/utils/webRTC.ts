import PostMessageEvent from '@root/shared/postMessageEvent'
import {
  onPostMessage,
  postMessageToChild,
  postMessageToTop,
} from './windowMessages'
import isTop from '@root/shared/isTop'

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
}

/**接收端 */
export const getMediaStreamInGetter = (props?: { target?: Window }) => {
  const pc = { current: new RTCPeerConnection(servers) }
  const mediaStream = new MediaStream()

  const unListens = [
    onPostMessage(PostMessageEvent.webRTC_offer, async (data) => {
      pc.current.setRemoteDescription(new RTCSessionDescription(data))

      const answer = await pc.current.createAnswer()
      await pc.current.setLocalDescription(answer)

      if (!isTop) {
        postMessageToTop(PostMessageEvent.webRTC_answer, answer)
      } else {
        postMessageToChild(
          PostMessageEvent.webRTC_answer,
          answer,
          props?.target,
        )
      }
    }),
    onPostMessage(PostMessageEvent.webRTC_candidate, async (data) => {
      pc.current.addIceCandidate(new RTCIceCandidate(data))
    }),
  ]

  pc.current.ontrack = (event) => {
    mediaStream.addTrack(event.track)
  }

  return {
    mediaStream,
    unMount: () => {
      pc.current.close()
      unListens.forEach((unListen) => unListen())
    },
  }
}

export const sendMediaStreamInSender = (props: {
  stream: MediaStream
  target?: Window
}) => {
  const pc = { current: new RTCPeerConnection(servers) }
  const mediaStream = new MediaStream()
  const stream = props.stream,
    target = props.target

  mediaStream.addTrack(stream.getVideoTracks()[0])
  pc.current.addTrack(mediaStream.getVideoTracks()[0], mediaStream)

  const unListens = [
    onPostMessage(PostMessageEvent.webRTC_answer, async (data) => {
      pc.current.setRemoteDescription(new RTCSessionDescription(data))
    }),
  ]

  pc.current.onicecandidate = (event) => {
    if (event.candidate) {
      if (!isTop) {
        postMessageToTop(
          PostMessageEvent.webRTC_candidate,
          JSON.parse(JSON.stringify(event.candidate)),
        )
      } else {
        postMessageToChild(
          PostMessageEvent.webRTC_candidate,
          JSON.parse(JSON.stringify(event.candidate)),
          target,
        )
      }
    }
  }

  pc.current.createOffer().then((offer) => {
    pc.current.setLocalDescription(offer)
    if (!isTop) {
      postMessageToTop(PostMessageEvent.webRTC_offer, offer)
    } else {
      postMessageToChild(PostMessageEvent.webRTC_offer, offer, target)
    }
  })

  return {
    mediaStream,
    unMount: () => {
      pc.current.close()
      unListens.forEach((unListen) => unListen())
      mediaStream.getTracks().forEach((track) => track.stop())
    },
  }
}
