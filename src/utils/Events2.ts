// import Events from 'events'
import mitt, { WildcardHandler, Handler } from 'mitt'

export default class Events2<Events extends Record<string, unknown>> {
  mitt = mitt<Events>()

  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void
  on(type: '*', handler: WildcardHandler<Events>): void
  on(type: any, handler: any) {
    return this.mitt.on(type, handler)
  }
  on2<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>,
  ): () => void {
    this.mitt.on(type as any, handler as any)
    return () => {
      this.mitt.off(type as any, handler as any)
    }
  }

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void
  emit<Key extends keyof Events>(
    type: undefined extends Events[Key] ? Key : never,
  ): void
  emit(type: any, event?: any) {
    return this.mitt.emit(type, event)
  }

  off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void
  off(type: '*', handler: WildcardHandler<Events>): void
  off(type: any, handler: any) {
    return this.mitt.off(type, handler)
  }
  offAll() {
    this.mitt.all.clear()
  }
}
