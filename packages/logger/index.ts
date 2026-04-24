export { setLoggerNamespaceEnabled } from './namespaces'
export type { LoggerLevel, LoggerStorageEnv, LogPayload } from './types'
export {
  createNamespacedLogger,
  createRootLogger,
  getLoggerMemorySnapshot,
} from './core'
export type { NamespacedLogger, RootLogger } from './core'
export { getLoggerSessionStorageKey } from './session-key'
export { getNamespaceConsoleColor } from './namespace-style'
