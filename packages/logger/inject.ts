import PostMessageEvent from '@root/shared/postMessageEvent'
import { postMessageToTop } from '@root/utils/windowMessages'
import {
  createRootLogger,
  type NamespacedLogger,
  type RootLogger,
} from './core'
import { setLoggerNamespaceEnabled } from './namespaces'
import { isLoggerEnabledForInjectDocument } from './show-log'
import type { LoggerPersistEntry } from './types'

function injectPersist(lines: LoggerPersistEntry[]): void {
  postMessageToTop(PostMessageEvent.loggerPersist, { lines })
}

export type InjectLogger = Omit<RootLogger, 'namespace'> & {
  namespace: ((name: string) => NamespacedLogger) & {
    enable: (namespace: string, enabled: boolean) => void
  }
}

const base = createRootLogger({
  shouldEmit: isLoggerEnabledForInjectDocument,
  persist: injectPersist,
})

const namespace = Object.assign((name: string) => base.namespace(name), {
  enable: setLoggerNamespaceEnabled,
})

/** Inject logger: root methods + `logger.namespace(name)` + `logger.namespace.enable(name, on)`. */
const logger: InjectLogger = {
  log: base.log,
  info: base.info,
  warn: base.warn,
  error: base.error,
  assert: base.assert,
  userAction: base.userAction,
  namespace,
}

export default logger
