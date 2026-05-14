export type EventHandler = {
  on: (event: string, handler: (...args: any[]) => void) => void
  off: (event: string, handler: (...args: any[]) => void) => void
  send: (event: string, ...args: any[]) => Promise<any>
}
