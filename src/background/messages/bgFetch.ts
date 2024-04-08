import { onMessage } from 'webext-bridge/background'

onMessage('bgFetch', async (req) => {
  const data = (req.data as any).body
  const type = data.options?.type ?? 'json'
  const fetchRes = await fetch(data.url, data.options).then(async (res) => {
    switch (type) {
      case 'json':
        return res.json()
      case 'text':
        return res.text()
      case 'blob': {
        const blob = await res.blob()
        return URL.createObjectURL(blob)
      }
    }
  })

  return fetchRes
})
