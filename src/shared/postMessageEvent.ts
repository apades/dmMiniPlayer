import { DocPIPRenderType } from '@root/store/config'

enum PostMessageEvent {
  startPIPFromFloatButton = 'startPIPFromFloatButton',
  startPIPWithWebRTC = 'startPIPWithWebRTC',
  updateVideoState = 'updateVideoState',
  detectVideo_req = 'detectVideo_req',
  detectVideo_resp = 'detectVideo_resp',
  requestVideoPIP = 'requestVideoPIP',
  openSettingPanel = 'openSettingPanel',
  webRTC_offer = 'webRTCOffer',
  webRTC_answer = 'webRTCAnswer',
  webRTC_candidate = 'webRTCCandidate',
  webRTC_close = 'webRTCClose',
}

export type BaseVideoState = {
  id: string
  duration: number
  currentTime: number
  isPause: boolean
}

export type VideoPosData = {
  x: number
  y: number
  w: number
  h: number
  vw: number
  vh: number
}

export interface PostMessageProtocolMap {
  [PostMessageEvent.startPIPFromFloatButton]: {
    cropTarget?: CropTarget
    restrictionTarget?: RestrictionTarget
    posData: VideoPosData
    videoState: BaseVideoState
    renderType: DocPIPRenderType
  }
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
  [PostMessageEvent.startPIPWithWebRTC]: BaseVideoState
  [PostMessageEvent.requestVideoPIP]: { id: string }
  [PostMessageEvent.openSettingPanel]: void
  [PostMessageEvent.webRTC_offer]: RTCSessionDescriptionInit
  [PostMessageEvent.webRTC_answer]: RTCSessionDescriptionInit
  [PostMessageEvent.webRTC_candidate]: RTCIceCandidateInit
  [PostMessageEvent.webRTC_close]: void
}

export default PostMessageEvent
