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

/**
 * Fallback when {@link HTMLVideoElement.videoWidth} / {@link HTMLVideoElement.videoHeight} are not ready yet.
 * Not the stream's real network bitrate — DOM has no such API.
 */
export const DEFAULT_WEBRTC_VIDEO_MAX_BITRATE_BPS = 12_000_000

/** Upper bound for outbound encoded frame rate (`RTCRtpEncodingParameters.maxFramerate`). */
export const DEFAULT_WEBRTC_VIDEO_MAX_FRAMERATE = 60

type ApplyOutboundVideoEncodingOptions = {
  maxBitrateBps?: number
  /**
   * Encoded RTP max frame rate. Does not raise source fps: `captureStream()` only
   * produces frames when the video paints; this caps what the encoder sends.
   */
  maxFramerate?: number
}

/**
 * Suggest outbound WebRTC `maxBitrate` from decoded frame size on the video element.
 * This is a heuristic cap, not the media manifest or measured network bitrate.
 */
export function suggestWebRtcVideoMaxBitrateBpsFromVideoEl(
  video: HTMLVideoElement,
): number {
  const w = video.videoWidth
  const h = video.videoHeight
  if (w <= 0 || h <= 0) return DEFAULT_WEBRTC_VIDEO_MAX_BITRATE_BPS

  const longEdge = Math.max(w, h)
  if (longEdge >= 3840) return 45_000_000
  if (longEdge >= 2560) return 28_000_000
  if (longEdge >= 1920) return 12_000_000
  if (longEdge >= 1280) return 6_000_000
  if (longEdge >= 854) return 3_500_000
  return 2_000_000
}

async function applyHighQualityVideoEncoding(
  pc: RTCPeerConnection,
  options: ApplyOutboundVideoEncodingOptions = {},
) {
  const maxBitrateBps =
    options.maxBitrateBps ?? DEFAULT_WEBRTC_VIDEO_MAX_BITRATE_BPS
  const maxFramerate =
    options.maxFramerate ?? DEFAULT_WEBRTC_VIDEO_MAX_FRAMERATE

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
      enc.maxFramerate = maxFramerate
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
  /** Outbound encoded max frame rate. Default {@link DEFAULT_WEBRTC_VIDEO_MAX_FRAMERATE}. */
  videoMaxFramerate?: number
}) => {
  const pc = { current: new RTCPeerConnection(servers) }
  const mediaStream = new MediaStream()
  const stream = props.stream,
    target = props.target
  const videoMaxBitrateBps =
    props.videoMaxBitrateBps ?? DEFAULT_WEBRTC_VIDEO_MAX_BITRATE_BPS
  const videoMaxFramerate =
    props.videoMaxFramerate ?? DEFAULT_WEBRTC_VIDEO_MAX_FRAMERATE

  const encodingOptions: ApplyOutboundVideoEncodingOptions = {
    maxBitrateBps: videoMaxBitrateBps,
    maxFramerate: videoMaxFramerate,
  }

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
      await applyHighQualityVideoEncoding(pc.current, encodingOptions)
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
    await applyHighQualityVideoEncoding(pc.current, encodingOptions)
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
