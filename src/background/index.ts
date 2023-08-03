import './commands'
import { listen } from '@plasmohq/messaging/message'
import Browser from 'webextension-polyfill'

listen((req, res) => {
  switch (req.name) {
    case 'PIP-need-click-notifications': {
      Browser.notifications.create(new Date().getTime() + '', {
        type: 'basic',
        message: '由于浏览器限制，需要去网页上随便点击下才能显示画中画',
        title: '报错',
        iconUrl: Browser.runtime.getURL('/assets/icon.png'),
        ...{ requireInteraction: true },
      })
      break
    }
  }
})
