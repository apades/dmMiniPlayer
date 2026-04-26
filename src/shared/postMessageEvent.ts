/**
 * this event system is use for iframe and top window communication
 *
 * |---------|              |-------------|
 * |   top   |  send msg    |   iframe    |
 * |         |  <------->   |   videoEl   |
 * |---------|              |-------------|
 *
 * **Only top can use documentPictureInPicture API**, so if videoEl is in iframe
 * 1. Request PIP from iframe, send msg to top from iframe
 * 2. Top request PIP, and find the videoEl in iframe, then request PIP
 *
 * This event system is also use for top and top window communication (VideoEl in top window)
 */
import { DocPIPRenderType } from '@root/types/config'
import type { LoggerPersistEntry } from '@pkgs/logger/types'

enum PostMessageEvent {
  requestPlayerInit = 'requestPlayerInit',
  requestPlayerInit_resp = 'requestPlayerInit_resp',
  checkUserActivationActive = 'checkUserActivationActive',
  checkUserActivationActive_resp = 'checkUserActivationActive_resp',
  requestPlayerInitFromVid = 'requestPlayerInitFromVid',
  startPIPWithWebRTC = 'startPIPWithWebRTC',
  updateVideoState = 'updateVideoState',
  detectVideo_req = 'detectVideo_req',
  detectVideo_resp = 'detectVideo_resp',
  openSettingPanel = 'openSettingPanel',
  getRenderType = 'getRenderType',
  getRenderType_resp = 'getRenderType_resp',
  webRTC_offer = 'webRTCOffer',
  webRTC_answer = 'webRTCAnswer',
  webRTC_candidate = 'webRTCCandidate',
  webRTC_close = 'webRTCClose',
  fullInWeb_request = 'fullInWeb_request',
  fullInWeb_close = 'fullInWeb_close',
  fullInWeb_eventProxy = 'fullInWeb_eventProxy',
  closePlayer = 'closePlayer',
  asyncData = 'asyncData',
  /** Persist inject-world logger lines to extension storage (handled in main content script). */
  loggerPersist = 'loggerPersist',
  /** Extension content script: iframe requests shared `ext_cs` logger session uuid from top. */
  loggerExtCsUuid_req = 'loggerExtCsUuid_req',
  loggerExtCsUuid_resp = 'loggerExtCsUuid_resp',
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

export enum RequestPlayerInitFrom {
  'floatButton.pip' = 'floatButton.pip',
  'floatButton.replace' = 'floatButton.replace',
  'autoPIP.scrollOut' = 'autoPIP.scrollOut',
  'api.requestPictureInPicture' = 'api.requestPictureInPicture',
  'api.mediaSession.enterpictureinpicture.useraction' = 'api.mediaSession.enterpictureinpicture.useraction',
  'api.mediaSession.enterpictureinpicture.contentoccluded' = 'api.mediaSession.enterpictureinpicture.contentoccluded',
  extensionPopup = 'extensionPopup',
}

export enum RequestPlayerInitFromType {
  'iframe-cannot-access-top',
  'iframe-can-access-top',
  'top',
}

export interface PostMessageProtocolMap {
  [PostMessageEvent.requestPlayerInit]: {
    cropTarget?: CropTarget
    restrictionTarget?: RestrictionTarget
    posData: VideoPosData
    videoState: BaseVideoState
    renderType: DocPIPRenderType
    from: RequestPlayerInitFrom
    topContainerEl?: HTMLElement
    isFixedPos?: boolean
  }
  [PostMessageEvent.getRenderType]: { fromType: RequestPlayerInitFromType }
  [PostMessageEvent.getRenderType_resp]: { renderType: DocPIPRenderType }
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
  [PostMessageEvent.checkUserActivationActive]: void
  [PostMessageEvent.checkUserActivationActive_resp]: { isActive: boolean }
  [PostMessageEvent.startPIPWithWebRTC]: BaseVideoState
  [PostMessageEvent.requestPlayerInitFromVid]: {
    id: string
    from: RequestPlayerInitFrom
  }
  [PostMessageEvent.openSettingPanel]: void
  [PostMessageEvent.webRTC_offer]: RTCSessionDescriptionInit
  [PostMessageEvent.webRTC_answer]: RTCSessionDescriptionInit
  [PostMessageEvent.webRTC_candidate]: RTCIceCandidateInit
  [PostMessageEvent.webRTC_close]: void
  [PostMessageEvent.fullInWeb_request]: void
  [PostMessageEvent.fullInWeb_close]: void
  [PostMessageEvent.fullInWeb_eventProxy]: {
    target: { tagName: string; contentEditable: string }
    code: string
    type: string
  }
  [PostMessageEvent.requestPlayerInit_resp]: {
    isOk: boolean
    errMsg?: string
  }
  [PostMessageEvent.closePlayer]: {
    type?:
      | 'autoPIP_closeInReturnToOriginPos'
      | 'api.exitPictureInPicture'
      | 'event.leavepictureinpicture'
  } | void

  [PostMessageEvent.asyncData]: {
    data: any
    key: string
  }
  [PostMessageEvent.loggerPersist]: { lines: LoggerPersistEntry[] }
  [PostMessageEvent.loggerExtCsUuid_req]: void
  [PostMessageEvent.loggerExtCsUuid_resp]: { uuid: string }
}

export default PostMessageEvent
