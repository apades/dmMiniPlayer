// import type { PlasmoCSConfig } from 'plasmo'
import { setNamespace, onMessage } from 'webext-bridge/window'
import '../inject'
import WebextEvent, { WEBEXT_NSP } from '@root/shared/webextEvent'

setNamespace(WEBEXT_NSP)

onMessage(WebextEvent.openPIP, () => {
  console.log('openPIP', location.host)
})

// console.log('run inject in', location.href)
// // 只在iframe里测试
// if (window.parent !== window) {
//   const oParent = window.parent
//   const oLocation = window.location

//   const pLocation = new Proxy(oLocation, {
//     get(target: any, p, receiver) {
//       console.log('pLocation get', p)
//       return target[p]
//     },
//     set(target, p, newValue, receiver) {
//       console.log('pLocation set', p)
//       target[p] = newValue
//       return true
//     },
//   })

//   window.parent = new Proxy(oParent, {
//     get(target: any, p, receiver) {
//       if (p == 'location') {
//         return pLocation
//       }
//       return target[p]
//     },
//     set(target, p, newValue, receiver) {
//       target[p] = newValue
//       return true
//     },
//   })
// }

// export const config: PlasmoCSConfig = {
//   matches: ['<all_urls>'],
//   world: 'MAIN',
//   run_at: 'document_start',
//   all_frames: true,
// }
