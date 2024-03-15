import Events from 'events'

type EventType = string | symbol
type Handler<T = unknown> = (event: T) => void

export default class Events2<
  Events extends Record<EventType, unknown>
> extends Events {
  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>) {
    return super.on(type as EventType, handler)
  }
  on2<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>
  ): () => void {
    super.on(type as EventType, handler)
    return () => {
      super.off(type as EventType, handler)
    }
  }

  once<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>) {
    return super.once(type as EventType, handler)
  }
  off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>) {
    if (!this.off) return this.removeAllListeners(type as EventType)
    return super.off(type as EventType, handler)
  }
  emit<Key extends keyof Events>(type: Key, args: Events[Key]): boolean
  emit<Key extends keyof Events>(
    type: undefined extends Events[Key] ? Key : never
  ): boolean
  emit<Key extends keyof Events>(type: Key, args?: Events[Key]) {
    return super.emit(type as EventType, args)
  }
  eventNames<Key extends keyof Events>(): Key[] {
    return super.eventNames() as Key[]
  }
}
