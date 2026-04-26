import type { LoggerPersistEntry, LoggerStorageEnv } from './types'
import { getLoggerSessionStorageKey } from './session-key'

const LOGGER_STORAGE_KEY_RE = /^(?:inject|ext_cs|ext_bg)_\d{10}_[0-9a-f]{4}$/

/** In-session log entries per storage env; session uuid exists only in this runtime, so no read-merge is needed. */
const buffers = new Map<LoggerStorageEnv, LoggerPersistEntry[]>()
const writeTail = new Map<LoggerStorageEnv, Promise<void>>()

function getBuffer(env: LoggerStorageEnv): LoggerPersistEntry[] {
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
  if (!snapshot.length) return

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: snapshot }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve()
    })
  })
}

/** Append persisted log entries (`parts` serialized; metadata kept as plain fields) for the given environment. */
export function appendLoggerLinesToChromeStorage(
  env: LoggerStorageEnv,
  lines: LoggerPersistEntry[],
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

export function clearChromeLoggerStorage(): Promise<void> {
  buffers.clear()
  writeTail.clear()

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }

      const keys = Object.keys(items).filter((key) =>
        LOGGER_STORAGE_KEY_RE.test(key),
      )
      if (!keys.length) {
        resolve()
        return
      }

      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
        else resolve()
      })
    })
  })
}
