import isBG from '@root/shared/isBG'
import {
  clearLoggerRuntimeState,
  createRootLogger,
  type NamespacedLogger,
  type RootLogger,
} from './core'
import {
  appendLoggerLinesToChromeStorage,
  clearChromeLoggerStorage,
} from './persist-chrome'
import { setLoggerNamespaceEnabled } from './namespaces'
import { isLoggerEnabledForExtension } from './show-log'
import type { LoggerStorageEnv } from './types'

function extensionStorageEnv(): LoggerStorageEnv {
  return isBG ? 'ext_bg' : 'ext_cs'
}

function clearAllLoggerLogs(): Promise<void> {
  clearLoggerRuntimeState()
  return clearChromeLoggerStorage()
}

;(globalThis as { $clearLoggerLogs?: () => Promise<void> }).$clearLoggerLogs =
  clearAllLoggerLogs

export type ExtensionLogger = Omit<RootLogger, 'namespace'> & {
  namespace: ((name: string) => NamespacedLogger) & {
    enable: (namespace: string, enabled: boolean) => void
  }
}

const base = createRootLogger({
  shouldEmit: () => isLoggerEnabledForExtension(isBG),
  persist: (lines) => {
    appendLoggerLinesToChromeStorage(extensionStorageEnv(), lines)
  },
})

const namespace = Object.assign((name: string) => base.namespace(name), {
  enable: setLoggerNamespaceEnabled,
})

/** Extension logger: root methods + `logger.namespace(name)` + `logger.namespace.enable(name, on)`. */
const logger: ExtensionLogger = {
  log: base.log,
  info: base.info,
  warn: base.warn,
  error: base.error,
  assert: base.assert,
  userAction: base.userAction,
  namespace,
}

export default logger
export {
  appendLoggerLinesToChromeStorage,
  clearChromeLoggerStorage,
} from './persist-chrome'
