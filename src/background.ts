import Browser from 'webextension-polyfill'
import _env from './utils/env'

if (_env.isDev) {
  Browser.contextMenus.create({
    id: 'open-test-tab',
    type: 'normal',
    title: 'test-tab',
    contexts: ['all'],
  })
}
Browser.contextMenus.onClicked.addListener((e) => {
  switch (e.menuItemId) {
    case 'open-test-tab': {
      Browser.tabs.create({ url: Browser.runtime.getURL('/tabs/test.html') })
    }
  }
})

async function changeIcon(url: string) {
  const img = new Image()
  img.src = url
  const canvas = new OffscreenCanvas(16, 16)
  const context = canvas.getContext('2d')
  context.drawImage(img, 0, 0)
  const imageData = context.getImageData(0, 0, 16, 16)
  Browser.action.setIcon({ imageData: imageData as any })
}
