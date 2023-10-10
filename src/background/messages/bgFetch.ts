import type { PlasmoMessaging } from '@plasmohq/messaging'

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const data = req.body
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
  res.send(fetchRes)
}

export default handler
