enum PostMessageEvent {
  startPIPCaptureDisplayMedia = 'startPIPCaptureDisplayMedia',
  startPIPWithWebRTC = 'startPIPWithWebRTC',
  updateVideoState = 'updateVideoState',
  startPIPFromButtonClick = 'startPIPFromButtonClick',
  detectVideo_req = 'detectVideo_req',
  detectVideo_resp = 'detectVideo_resp',
  requestVideoPIP = 'requestVideoPIP',
  openSettingPanel = 'openSettingPanel',
  webRTC_offer = 'webRTCOffer',
  webRTC_answer = 'webRTCAnswer',
  webRTC_candidate = 'webRTCCandidate',
}

export type BaseVideoState = {
  id: string
  duration: number
  currentTime: number
  isPause: boolean
}

export interface PostMessageProtocolMap {
  [PostMessageEvent.startPIPCaptureDisplayMedia]: {
    cropTarget: ReturnType<typeof window.CropTarget.fromElement>
    x: number
    y: number
    w: number
    h: number
    vw: number
    vh: number
  } & BaseVideoState
  [PostMessageEvent.updateVideoState]: Partial<{
    isPause: boolean
    isPlay: boolean
    currentTime: number
  }> & { id: string }
  [PostMessageEvent.detectVideo_req]: void
  [PostMessageEvent.detectVideo_resp]: {
    id: string
    w: number
    h: number
    isMute: boolean
    isPlaying: boolean
  }[]
  [PostMessageEvent.startPIPFromButtonClick]: { id: string }
  [PostMessageEvent.startPIPWithWebRTC]: BaseVideoState
  [PostMessageEvent.requestVideoPIP]: { id: string }
  [PostMessageEvent.openSettingPanel]: void
  [PostMessageEvent.webRTC_offer]: RTCSessionDescriptionInit
  [PostMessageEvent.webRTC_answer]: RTCSessionDescriptionInit
  [PostMessageEvent.webRTC_candidate]: RTCIceCandidateInit
}

export default PostMessageEvent
