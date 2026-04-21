import PostMessageEvent from '@root/shared/postMessageEvent'
import isTop from '@root/shared/isTop'
import {
  onPostMessage,
  postMessageToChild,
  postMessageToTop,
} from './windowMessages'

const servers = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun.cloudflare.com:3478',
        'stun:stun.nextcloud.com:443',
        'stun:stun.hitv.com:3478',
        'stun:stun.miwifi.com:3478',
        'stun:stun.voip.aebc.com:3478',
        'stun:stun.voipbuster.com:3478',
        'stun:stun.voipstunt.com:3478',
        'stun:relay.webwormhole.io',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
}

/** Default cap for outbound video; raise if source is 4K and CPU/network allow. */
const DEFAULT_VIDEO_MAX_BITRATE_BPS = 12_000_000

async function applyHighQualityVideoEncoding(
  pc: RTCPeerConnection,
  maxBitrateBps = DEFAULT_VIDEO_MAX_BITRATE_BPS,
) {
  for (const sender of pc.getSenders()) {
    if (sender.track?.kind !== 'video') continue

    const params = sender.getParameters()
    const encodings =
      params.encodings.length > 0
        ? params.encodings.map((e) => ({ ...e }))
        : ([{}] as RTCRtpEncodingParameters[])

    for (const enc of encodings) {
      enc.maxBitrate = maxBitrateBps
      enc.scaleResolutionDownBy = 1
      if (enc.maxFramerate == null) enc.maxFramerate = 60
    }

    try {
      await sender.setParameters({
        ...params,
        encodings,
        degradationPreference: 'maintain-resolution',
      })
    } catch (err) {
      console.warn('[webRTC] setParameters failed', err)
    }
  }
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
  /** Outbound video max bitrate (bps). Default 12 Mbps. */
  videoMaxBitrateBps?: number
}) => {
  const pc = { current: new RTCPeerConnection(servers) }
  const mediaStream = new MediaStream()
  const stream = props.stream,
    target = props.target
  const videoMaxBitrateBps =
    props.videoMaxBitrateBps ?? DEFAULT_VIDEO_MAX_BITRATE_BPS

  const videoTrack = stream.getVideoTracks()[0]
  // Hint encoder: prefer detail over aggressive temporal filtering (when supported).
  if ('contentHint' in videoTrack) {
    try {
      ;(videoTrack as MediaStreamTrack & { contentHint: string }).contentHint =
        'detail'
    } catch {
      /* ignore */
    }
  }

  mediaStream.addTrack(videoTrack)
  pc.current.addTrack(mediaStream.getVideoTracks()[0], mediaStream)

  const unListens = [
    onPostMessage(PostMessageEvent.webRTC_answer, async (data) => {
      await pc.current.setRemoteDescription(new RTCSessionDescription(data))
      await applyHighQualityVideoEncoding(pc.current, videoMaxBitrateBps)
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

  void (async () => {
    const offer = await pc.current.createOffer()
    await pc.current.setLocalDescription(offer)
    await applyHighQualityVideoEncoding(pc.current, videoMaxBitrateBps)
    if (!isTop) {
      postMessageToTop(PostMessageEvent.webRTC_offer, offer)
    } else {
      postMessageToChild(PostMessageEvent.webRTC_offer, offer, target)
    }
  })()

  return {
    mediaStream,
    unMount: () => {
      pc.current.close()
      unListens.forEach((unListen) => unListen())
      mediaStream.getTracks().forEach((track) => track.stop())
    },
  }
}
