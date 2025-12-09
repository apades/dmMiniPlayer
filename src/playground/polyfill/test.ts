import { dispatchMessage } from './message'

window.addEventListener('polyfill-event', (e: any) => {
  const msg = e.detail,
    category = msg.title,
    content = msg.content

  console.log('👀:模拟bg收到消息 类别:', category, ' content:', content)

  switch (content.type) {
    case 'storage-get': {
      const localData = JSON.parse(localStorage['storage'] || '{}')
      dispatchMessage('browser-API', {
        type: 'storage-get',
        isResp: true,
        data: localData,
      })
    }
  }
})

dispatchMessage('browser-API', {
  type: 'runtime-sendMessage',
  data: { type: 'IS_CHAT_LOGIN' },
})
