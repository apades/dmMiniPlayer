/** Storage bucket for persisted log sessions (see promote.md key format). */
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

export type LoggerPersistConfig = {
  persist: (lines: string[]) => void | Promise<void>
}
