import { dq1 } from '@root/utils'
import { bootstrapInjection } from '../setup'

const TEST_URL_PATTERN = /\/api\/test\//

export type FetchTestEvent = {
  source: 'fetch' | 'xhr'
  url: string
  res: string
}

window.testFetchEvents = []

const client = bootstrapInjection(['fetch'])

const eventList = dq1('#event-list')!

function logEvent(event: FetchTestEvent) {
  window.testFetchEvents!.push(event)
  const item = document.createElement(['d', 'i', 'v'].join(''))
  item.className = 'event-item'
  item.textContent = `${event.source} ${event.url} -> ${event.res}`
  eventList.appendChild(item)
}

function resolveSource(data: {
  url: string
  args: unknown[]
}): FetchTestEvent['source'] {
  return typeof data.args[0] === 'string' && data.args[0] === data.url
    ? 'fetch'
    : 'xhr'
}

client.fetch.addListen(TEST_URL_PATTERN, (data) => {
  logEvent({
    source: resolveSource(data),
    url: data.url,
    res: data.res,
  })
})

window.runFetchRequest = async (url: string) => {
  await fetch(url)
}

window.runXHRRequest = (url: string) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.onload = () => resolve()
    xhr.onerror = () => reject(new Error('XHR failed'))
    xhr.send()
  })

window.testReady = true
