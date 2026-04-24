import PostMessageEvent from '@root/shared/postMessageEvent'
import {
  onPostMessage,
  postMessageToTop,
  replyPostMessageToSource,
} from '@root/utils/windowMessages'
import isBG from '@root/shared/isBG'
import type { LoggerStorageEnv } from './types'

const SESSION_ID_LENGTH = 4

function randomHex4(): string {
  const bytes = new Uint8Array(2)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, SESSION_ID_LENGTH)
}

let isTop = isTopFrame()
function initUuid() {
  if (isBG) return randomHex4()
  if (isTop) {
    let uuid = randomHex4()
    onPostMessage(PostMessageEvent.loggerExtCsUuid_req, (_, source) => {
      replyPostMessageToSource(source, PostMessageEvent.loggerExtCsUuid_resp, {
        uuid,
      })
    })
    return uuid
  }
  return null
}
let uuid = initUuid()
async function getUuid() {
  if (uuid) return uuid
  return requestExtCsUuidFromTopFrame()
}
;(globalThis as any).$getUuid = getUuid

function getWindow(): Window | undefined {
  return (globalThis as { window?: Window }).window
}

function isTopFrame(): boolean {
  const w = getWindow()
  return !!w && w === w.top
}

/**
 * Cross-origin iframe: top could not be read from DOM; ask top for the same uuid via `postMessage`.
 */
function requestExtCsUuidFromTopFrame(): Promise<string> {
  return new Promise((resolve) => {
    let done = false
    const un = onPostMessage(PostMessageEvent.loggerExtCsUuid_resp, (data) => {
      if (done) return
      done = true
      un()
      clearTimeout(tid)
      if (data?.uuid) {
        resolve(data.uuid)
      } else {
        console.warn(
          '[logger] ext_cs: invalid uuid from top, using local fallback',
        )
        uuid = randomHex4()
        resolve(uuid)
      }
    })
    const tid = setTimeout(() => {
      if (done) return
      done = true
      un()
      console.warn(
        '[logger] ext_cs: top did not respond in time, using local fallback',
      )
      uuid = randomHex4()
      resolve(uuid)
    }, 3000)
    postMessageToTop(PostMessageEvent.loggerExtCsUuid_req)
  })
}

/** YYMMDDHHmm in local timezone (2-digit year). */
function formatDateKey(d: Date): string {
  const yy = String(d.getFullYear() % 100).padStart(2, '0')
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yy}${m}${day}${h}${min}`
}

/**
 * Key format: environment_YYMMDDHHmm_uuid (uuid = 4 hex chars, once per runtime / env).
 * ext_cs uuid: top frame sets `data-apades-logger-ext-cs` at load; iframes read DOM or
 * request via `PostMessageEvent.loggerExtCsUuid_req` / `loggerExtCsUuid_resp` (`windowMessages`).
 */
export async function getLoggerSessionStorageKey(
  env: LoggerStorageEnv,
  now: Date = new Date(),
): Promise<string> {
  let uuid = await getUuid()
  if (env === 'ext_cs') {
    return `${env}_${formatDateKey(now)}_${uuid}`
  }
  return `${env}_${formatDateKey(now)}_${uuid}`
}
