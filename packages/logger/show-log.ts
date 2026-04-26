import { ATTR_SHOW_LOG } from '@root/shared/config'
import isDev from '@root/shared/isDev'
import { SHOW_LOG } from '@root/shared/storeKey'

let storageShowLogEnabled = false
let hasInitStorageShowLog = false

function hasShowLogAttr(doc: Document | null | undefined): boolean {
  return !!doc?.documentElement?.hasAttribute(ATTR_SHOW_LOG)
}

function getCurrentDocument(): Document | null {
  return typeof document === 'undefined' ? null : document
}

function getTopDocument(): Document | null {
  if (typeof window === 'undefined') return null

  try {
    return window.top?.document ?? null
  } catch {
    return null
  }
}

function isExtensionDocument(doc: Document | null): boolean {
  return doc?.location.protocol === 'chrome-extension:'
}

function setStorageShowLog(value: unknown): void {
  storageShowLogEnabled = value === true
}

function initStorageShowLog(): void {
  if (hasInitStorageShowLog) return
  if (typeof chrome === 'undefined') return
  if (!chrome.storage?.sync) return

  hasInitStorageShowLog = true

  chrome.storage.sync.get(SHOW_LOG, (result) => {
    if (chrome.runtime.lastError) return
    setStorageShowLog(result[SHOW_LOG])
  })

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return
    if (!(SHOW_LOG in changes)) return

    setStorageShowLog(changes[SHOW_LOG].newValue)
  })
}

export function isLoggerEnabledForCurrentDocument(): boolean {
  return isDev || hasShowLogAttr(getCurrentDocument())
}

export function isLoggerEnabledForExtension(isBackground: boolean): boolean {
  if (isDev) return true
  const doc = getCurrentDocument()
  if (!isBackground && !isExtensionDocument(doc)) return hasShowLogAttr(doc)

  initStorageShowLog()
  return storageShowLogEnabled
}

export function isLoggerEnabledForInjectDocument(): boolean {
  return (
    isDev ||
    hasShowLogAttr(getCurrentDocument()) ||
    hasShowLogAttr(getTopDocument())
  )
}
