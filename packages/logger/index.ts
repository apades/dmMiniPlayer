export { setLoggerNamespaceEnabled } from './namespaces'
export type {
  LoggerLevel,
  LoggerPersistEntry,
  LoggerStorageEnv,
  LogPayload,
} from './types'
export {
  clearLoggerRuntimeState,
  createNamespacedLogger,
  createRootLogger,
  getLoggerMemorySnapshot,
} from './core'
export type { NamespacedLogger, RootLogger } from './core'
export { getLoggerSessionStorageKey } from './session-key'
export { getNamespaceConsoleColor } from './namespace-style'
