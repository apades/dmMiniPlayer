import { isBoolean } from 'lodash-es'
import { isObject } from '.'

/**
 * 事件开关
 */
export default class EventSwitcher<T extends EventTarget> {
  #eventMap: Record<string, ((e: any) => void)[]> = {}
  #disableMap: Record<string, boolean> = {}
  #originalAdd?: T['addEventListener']
  #originalRemove?: T['removeEventListener']
  #tar?: T
  constructor(tar: T) {
    this.#tar = tar

    const originalAdd = tar.addEventListener
    this.#originalAdd = originalAdd

    const eventMap = this.#eventMap

    tar.addEventListener = (
      ...[eventName, fn, options]: Parameters<T['addEventListener']>
    ) => {
      const optionsName = this.#resolveOptionsToStringName(options)
      const key = [eventName, optionsName].join('-')

      // TODO inOnce
      const isOnce = isObject(options) && options.once
      // first init
      if (!eventMap[key]) {
        eventMap[key] = []
        originalAdd.call(tar, eventName, (e) => {
          if (this.#disableMap[key]) return
          eventMap[key].forEach((fn) => fn(e))
        })
      }

      eventMap[key].push(fn as () => void)
    }

    const originalRemove = tar.removeEventListener
    this.#originalRemove = originalRemove

    tar.removeEventListener = (
      ...[eventName, fn, options]: Parameters<T['removeEventListener']>
    ) => {
      const optionsName = this.#resolveOptionsToStringName(options)
      const key = [eventName, optionsName].join('-')

      originalRemove.call(tar, eventName, fn, options)

      eventMap[key].slice(eventMap[key].indexOf(fn as () => void), 1)
    }
  }

  unload = () => {
    if (!this.#tar || !this.#originalAdd || !this.#originalRemove) return

    this.#tar.addEventListener = this.#originalAdd
    this.#tar.removeEventListener = this.#originalRemove
  }

  disable(eventName: string, options?: Parameters<T['addEventListener']>[2]) {
    const optionsName = this.#resolveOptionsToStringName(options)
    const key = [eventName, optionsName].join('-')

    this.#disableMap[key] = true
  }
  enable(eventName: string, options?: Parameters<T['addEventListener']>[2]) {
    const optionsName = this.#resolveOptionsToStringName(options)
    const key = [eventName, optionsName].join('-')

    this.#disableMap[key] = false
  }

  #resolveOptionsToStringName(options?: Parameters<T['addEventListener']>[2]) {
    if (!options) return ''
    if (isBoolean(options)) return options + ''
    const sortedKey = Object.keys(options).sort()

    return sortedKey.map((key) => `${key}:${(options as any)[key]}`).join(',')
  }
}
