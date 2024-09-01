import 'webext-bridge/background'
import './commands'
import './messages/bgFetch'
import { onMessage } from 'webext-bridge/background'
import Browser from 'webextension-polyfill'
// import './messages/bgFetch'

console.log('run bg')
onMessage('PIP-need-click-notifications', (req) => {
  Browser.notifications.create(new Date().getTime() + '', {
    type: 'basic',
    message: '由于浏览器限制，需要去网页上随便点击下才能显示画中画',
    title: '报错',
    iconUrl: Browser.runtime.getURL('/assets/icon.png'),
    ...{ requireInteraction: true },
  })
})
// listen((req, res) => {
//   switch (req.name) {
//     case 'PIP-need-click-notifications': {
//       Browser.notifications.create(new Date().getTime() + '', {
//         type: 'basic',
//         message: '由于浏览器限制，需要去网页上随便点击下才能显示画中画',
//         title: '报错',
//         iconUrl: Browser.runtime.getURL('/assets/icon.png'),
//         ...{ requireInteraction: true },
//       })
//       break
//     }
//   }
// })
