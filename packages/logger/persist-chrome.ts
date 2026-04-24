import type { LoggerStorageEnv } from './types'
import { getLoggerSessionStorageKey } from './session-key'

/** In-session log lines per storage env; session uuid exists only in this runtime, so no read-merge is needed. */
const buffers = new Map<LoggerStorageEnv, string[]>()
const writeTail = new Map<LoggerStorageEnv, Promise<void>>()

function getBuffer(env: LoggerStorageEnv): string[] {
  let buf = buffers.get(env)
  if (!buf) {
    buf = []
    buffers.set(env, buf)
  }
  return buf
}

async function writeBufferToStorage(env: LoggerStorageEnv): Promise<void> {
  const key = await getLoggerSessionStorageKey(env)
  const snapshot = [...getBuffer(env)]
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: snapshot }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve()
    })
  })
}

/** Append flattened log lines (`serialized ---- timestamp`) for the given environment. */
export function appendLoggerLinesToChromeStorage(
  env: LoggerStorageEnv,
  lines: string[],
): void {
  if (!lines.length) return

  getBuffer(env).push(...lines)

  const prev = writeTail.get(env) ?? Promise.resolve()
  const next = prev
    .then(() => writeBufferToStorage(env))
    .catch(() => {
      // Keep the chain alive after storage errors
    })

  writeTail.set(env, next)
}
