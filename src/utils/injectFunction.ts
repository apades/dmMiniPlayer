/* eslint-disable @typescript-eslint/ban-types */
import { isArray } from 'lodash-es'
import { KeyOfType } from './typeUtils'

export function injectFunction<
  T extends object,
  K extends KeyOfType<T, Function>
>(
  origin: T,
  keys: K[] | K,
  cb: (...args: any) => void
): {
  originKeysValue: T[K][]
  // proxy: T
} {
  if (!isArray(keys)) keys = [keys]

  let originKeysValue = keys.map((k) => origin[k])

  keys.map((key, i) => {
    ;(origin as any)[key] = (...args: any) => {
      cb(...args)
      return (originKeysValue[i] as Function).apply(origin, args)
    }
  })
  // TODO set value的proxy
  // let proxy = new Proxy(origin, {
  //   get(_, key: string) {
  //     let val = (origin as any)[key]
  //     if (!_keys.includes(key) && !isFunction(val)) return val
  //     return function (...args: any) {
  //       cb(...args)
  //       return val.apply(origin, args)
  //     }
  //   },
  //   set(_, key: string, val) {
  //     if (_keys.includes(key)) cb()
  //     try {
  //       ;(origin as any)[key] = val
  //       return true
  //     } catch (error) {
  //       console.error(error)
  //       return false
  //     }
  //   },
  // })

  return { originKeysValue /* , proxy */ }
}
