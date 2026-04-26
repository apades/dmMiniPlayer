/** Storage bucket for persisted log sessions (see prompt.md key format). */
export type LoggerStorageEnv = 'inject' | 'ext_cs' | 'ext_bg'

export type LoggerLevel =
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'assert'
  | 'userAction'

export type LogPayload = {
  level: LoggerLevel
  parts: unknown[]
  timestamp: number
  namespace?: string
}

export type LoggerPersistEntry = Omit<LogPayload, 'parts'> & {
  parts: string
}

export type LoggerPersistConfig = {
  persist: (lines: LoggerPersistEntry[]) => void | Promise<void>
  shouldEmit?: () => boolean
}
