import serialize from 'serialize'
import { getNamespaceConsoleColor } from './namespace-style'
import { isLoggerNamespaceEnabled } from './namespaces'
import type {
  LoggerLevel,
  LoggerPersistConfig,
  LoggerPersistEntry,
  LogPayload,
} from './types'

const FLUSH_DEBOUNCE_MS = 80
const memoryLogEntries: LogPayload[] = []
const pendingPersistQueues = new Set<LoggerPersistEntry[]>()

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

function shouldEmit(config: LoggerPersistConfig): boolean {
  return config.shouldEmit?.() ?? true
}

/** Persist metadata directly; only message parts need the custom serializer. */
function formatPersistEntry(payload: LogPayload): LoggerPersistEntry {
  return {
    level: payload.level,
    parts: serialize(payload.parts, { ignoreFunction: true }),
    timestamp: payload.timestamp,
    ...(payload.namespace ? { namespace: payload.namespace } : {}),
  }
}

function buildEmit(
  config: LoggerPersistConfig,
  schedule: (entry: LoggerPersistEntry) => void,
  namespace?: string,
) {
  return (level: LoggerLevel, parts: unknown[]) => {
    if (!shouldEmit(config)) {
      return
    }

    if (namespace && !isLoggerNamespaceEnabled(namespace)) {
      return
    }

    const payload: LogPayload = {
      level,
      parts,
      timestamp: Date.now(),
      ...(namespace ? { namespace } : {}),
    }

    const persistEntry = formatPersistEntry(payload)

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
    schedule(persistEntry)
  }
}

function createSchedulePersist(config: LoggerPersistConfig) {
  const pending: LoggerPersistEntry[] = []
  pendingPersistQueues.add(pending)
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    timer = null
    if (!pending.length) return
    const batch = pending.splice(0, pending.length)
    void Promise.resolve(config.persist(batch))
  }

  return (entry: LoggerPersistEntry) => {
    pending.push(entry)
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

export function clearLoggerRuntimeState(): void {
  memoryLogEntries.splice(0, memoryLogEntries.length)
  pendingPersistQueues.forEach((pending) => {
    pending.splice(0, pending.length)
  })
}
