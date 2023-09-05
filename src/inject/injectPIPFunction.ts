import { sendMessage_inject } from './injectListener'

// TODO 用开关控制
// Element.prototype.attachShadow = ()=>{}
// let origin = HTMLVideoElement.prototype.requestPictureInPicture

// console.log('inject requestPictureInPicture')
// HTMLVideoElement.prototype.requestPictureInPicture = function () {
//   //   return origin.bind(this)({ mode: 'open' })
//   console.log('player-startPIPPlay')
//   sendMessage_inject('start-PIP')
// } as any
