import { dq1 } from '@root/utils'
import { bootstrapInjection } from '../setup'

export type RunCodeTestEvent =
  | { type: 'callback'; payload: string }
  | { type: 'cleared' }

declare global {
  interface Window {
    __runCodePageState: { counter: number }
    __runCodeEventTarget?: EventTarget
  }
}

window.testRunCodeEvents = []
window.__runCodePageState = { counter: 0 }

const client = bootstrapInjection(['runCode'])
const eventList = dq1('#event-list')!

function logEvent(event: RunCodeTestEvent) {
  window.testRunCodeEvents!.push(event)
  const item = document.createElement(['d', 'i', 'v'].join(''))
  item.className = 'event-item'
  item.textContent = JSON.stringify(event)
  eventList.appendChild(item)
}

window.runCodeRunTest = async () => {
  window.__runCodePageState.counter = 0

  const first = await client.runCode.run(
    (delta: number) => {
      window.__runCodePageState.counter += delta
      return window.__runCodePageState.counter
    },
    [10],
  )

  const second = await client.runCode.run(
    () => window.__runCodePageState.counter,
  )

  return { first, second }
}

window.runCodeCallbackTest = async () => {
  window.testRunCodeEvents = []

  await client.runCode.run(() => {
    window.__runCodeEventTarget = new EventTarget()
  })

  const clear = client.runCode.runWithCallback(
    (onData) => {
      const handler = (e: Event) => onData((e as CustomEvent<string>).detail)
      window.__runCodeEventTarget!.addEventListener('run-code-test', handler)
      return () =>
        window.__runCodeEventTarget!.removeEventListener(
          'run-code-test',
          handler,
        )
    },
    [
      (payload: string) => {
        logEvent({ type: 'callback', payload })
      },
    ],
  )

  await new Promise((r) => setTimeout(r, 100))

  await client.runCode.run(() => {
    window.__runCodeEventTarget!.dispatchEvent(
      new CustomEvent('run-code-test', { detail: 'ping' }),
    )
  })

  await new Promise((r) => setTimeout(r, 100))

  await clear()
  logEvent({ type: 'cleared' })

  await client.runCode.run(() => {
    window.__runCodeEventTarget!.dispatchEvent(
      new CustomEvent('run-code-test', { detail: 'after-clear' }),
    )
  })

  await new Promise((r) => setTimeout(r, 100))
}

window.testReady = true
