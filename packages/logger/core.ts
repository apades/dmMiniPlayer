import serialize from 'serialize'
import { getNamespaceConsoleColor } from './namespace-style'
import { isLoggerNamespaceEnabled } from './namespaces'
import type { LoggerLevel, LoggerPersistConfig, LogPayload } from './types'

const FLUSH_DEBOUNCE_MS = 80
const memoryLogEntries: LogPayload[] = []

;(globalThis as any).memoryLogEntries = memoryLogEntries
const MEMORY_CAP = 5000

export type NamespacedLogger = {
  log: (...parts: unknown[]) => void
  info: (...parts: unknown[]) => void
  warn: (...parts: unknown[]) => void
  error: (...parts: unknown[]) => void
  assert: (condition: unknown, ...parts: unknown[]) => void
}

export type RootLogger = NamespacedLogger & {
  userAction: (...parts: unknown[]) => void
  namespace: (name: string) => NamespacedLogger
}

function pushMemory(entry: LogPayload): void {
  memoryLogEntries.push(entry)
  if (memoryLogEntries.length > MEMORY_CAP) {
    memoryLogEntries.splice(0, memoryLogEntries.length - MEMORY_CAP)
  }
}

function formatPersistLine(payload: LogPayload): string {
  const serialized = serialize(payload, { ignoreFunction: true })
  return `${serialized} ---- ${payload.timestamp}`
}

function buildEmit(
  config: LoggerPersistConfig,
  schedule: (line: string) => void,
  namespace?: string,
) {
  return (level: LoggerLevel, parts: unknown[]) => {
    if (namespace && !isLoggerNamespaceEnabled(namespace)) {
      return
    }

    const payload: LogPayload = {
      level,
      parts,
      timestamp: Date.now(),
      ...(namespace ? { namespace } : {}),
    }

    const line = formatPersistLine(payload)

    if (namespace) {
      const color = getNamespaceConsoleColor(namespace)
      const label = `%c[${namespace}]`
      const style = `color:${color};font-weight:600;`
      switch (level) {
        case 'warn':
          console.warn(label, style, ...parts)
          break
        case 'error':
        case 'assert':
          console.error(label, style, ...parts)
          break
        case 'info':
          console.info(label, style, ...parts)
          break
        default:
          console.log(label, style, ...parts)
      }
    } else {
      switch (level) {
        case 'warn':
          console.warn(...parts)
          break
        case 'error':
        case 'assert':
          console.error(...parts)
          break
        case 'info':
          console.info(...parts)
          break
        default:
          console.log(...parts)
      }
    }

    pushMemory(payload)
    schedule(line)
  }
}

function createSchedulePersist(config: LoggerPersistConfig) {
  const pending: string[] = []
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    timer = null
    if (!pending.length) return
    const batch = pending.splice(0, pending.length)
    void Promise.resolve(config.persist(batch))
  }

  return (line: string) => {
    pending.push(line)
    if (timer) return
    timer = setTimeout(flush, FLUSH_DEBOUNCE_MS)
  }
}

function makeNamespacedApi(
  config: LoggerPersistConfig,
  namespace: string,
): NamespacedLogger {
  const schedule = createSchedulePersist(config)
  const emit = buildEmit(config, schedule, namespace)
  return {
    log: (...parts) => emit('log', parts),
    info: (...parts) => emit('info', parts),
    warn: (...parts) => emit('warn', parts),
    error: (...parts) => emit('error', parts),
    assert: (condition, ...parts) => {
      if (condition) return
      emit('assert', ['Assertion failed:', ...parts])
    },
  }
}

export function createRootLogger(config: LoggerPersistConfig): RootLogger {
  const nsCache = new Map<string, NamespacedLogger>()
  const schedule = createSchedulePersist(config)
  const emit = buildEmit(config, schedule)

  const base: NamespacedLogger = {
    log: (...parts) => emit('log', parts),
    info: (...parts) => emit('info', parts),
    warn: (...parts) => emit('warn', parts),
    error: (...parts) => emit('error', parts),
    assert: (condition, ...parts) => {
      if (condition) return
      emit('assert', ['Assertion failed:', ...parts])
    },
  }

  return {
    ...base,
    userAction: (...parts) => emit('userAction', parts),
    namespace: (name: string) => {
      let hit = nsCache.get(name)
      if (!hit) {
        hit = makeNamespacedApi(config, name)
        nsCache.set(name, hit)
      }
      return hit
    },
  }
}

export function createNamespacedLogger(
  config: LoggerPersistConfig,
  namespace: string,
): NamespacedLogger {
  return makeNamespacedApi(config, namespace)
}

/** In-memory ring buffer of recent log payloads (not serialized; see persist path for string lines). */
export function getLoggerMemorySnapshot(): readonly LogPayload[] {
  return memoryLogEntries
}
