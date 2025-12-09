import { isFunction, isObject, isUndefined } from 'lodash-es'

export function sendEventToMac(name: string, content?: any) {
  try {
    window.webkit.messageHandlers.toNative.postMessage({
      title: name,
      content,
    })
  } catch (error) {}
}

export function isNull(val: any): boolean {
  return val === null || val === undefined
}

/**@deprecated 以后改进再用 */
const getKeyChain = (target: any, keyChain: string[] = []): string[] =>
  target.__key ? getKeyChain([...keyChain, target.__key]) : keyChain

export function objectDeepProxy<T = any>(
  target: T,
  originKey: string,
  option?: Partial<{
    onNull: (type: string, key: string) => void
  }>,
): T {
  return new Proxy(target as any, {
    get: (parent, key: string): any => {
      if (key === '__key') return originKey
      if (key === '__parent') return parent

      const val = (parent as any)[key]
      let rs
      if (isObject(val)) rs = objectDeepProxy(val, key)
      else if (isUndefined(val)) {
        option?.onNull?.('get', key)
        const fn = () => {
          //
        }
        ;(fn as any).__noAvailable = true
        ;(fn as any).__key = key
        rs = objectDeepProxy(fn, key)
      } else rs = val
      return rs
    },
    apply: (fn, thisArg, argArray) => {
      if (fn.__noAvailable) return option?.onNull?.('apply', fn.__key)
      if (isFunction(fn)) return fn(...argArray)
    },
  })
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, any> ? DeepPartial<T[P]> : T[P]
}
