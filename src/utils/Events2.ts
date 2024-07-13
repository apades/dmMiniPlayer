// import Events from 'events'
import mitt from 'mitt'

type Handler<T = unknown> = (event: T) => void

export default class Events2<Events extends Record<string, unknown>> {
  mitt = mitt<Events>()
  on = this.mitt.on
  on2<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>
  ): () => void {
    this.mitt.on(type, handler)
    return () => {
      this.mitt.off(type, handler)
    }
  }
  emit = this.mitt.emit
  off = this.mitt.off
}
