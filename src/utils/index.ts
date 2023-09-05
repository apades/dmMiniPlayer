import { isNumber, isNull, isEqual, extend, isFunction } from 'lodash-es'
import type { CSSProperties } from 'react'
import AsyncLock from './AsyncLock'
import type { Rec } from './typeUtils'

let el: HTMLSpanElement = null
export function getTextWidth(text: string, style: CSSProperties): number {
  if (!el) {
    el = document.createElement('span')
    document.body.appendChild(el)
    el.style.visibility = 'hidden'
    el.style.position = 'fixed'
    el.setAttribute('desc', 'calc text overflow node')
  }

  for (let k in style) {
    el.style[k as any] = (style as any)[k]
  }
  el.innerText = text

  // console.log('el.clientWidth', el.offsetWidth, el)

  return el.clientWidth
}

type WaitLoop = {
  (
    cb: () => boolean /* | Promise<boolean> */,
    limitTime?: number
  ): Promise<boolean>
  // TODO
  (
    cb: () => boolean /* | Promise<boolean> */,
    option?: Partial<{
      intervalTime: number
      intervalCount: number
      limitTime: number
    }>
  ): Promise<boolean>
}
export let waitLoopCallback: WaitLoop = (cb, option = 5000) => {
  return new Promise(async (res, rej) => {
    if (isNumber(option)) {
      let timer: NodeJS.Timeout
      let initTime = new Date().getTime()
      let loop = () => {
        let rs = cb()
        if (!rs) {
          if (!isNull(option) && new Date().getTime() - initTime > option)
            return res(false)
          return (timer = setTimeout(() => {
            loop()
          }, 500))
        } else return res(true)
      }
      loop()
    }
  })
}

const selfSorter = (it: any) => it
/** 升序排序 */
export const ascendingSort =
  <T>(itemProp: (obj: T) => number = selfSorter) =>
  (a: T, b: T) =>
    itemProp(a) - itemProp(b)

export function dq<K extends keyof HTMLElementTagNameMap>(selector: K) {
  return Array.from(document.querySelectorAll(selector))
}
export let dq1: {
  <K extends keyof HTMLElementTagNameMap>(selectors: K):
    | HTMLElementTagNameMap[K]
    | null
  <K extends keyof SVGElementTagNameMap>(selectors: K):
    | SVGElementTagNameMap[K]
    | null
  <E extends Element = HTMLDivElement>(selectors: string): E | null
} = (selector: string) => {
  let dom = document.querySelector(selector)
  return dom
}

export const onWindowLoad = () => {
  return new Promise<void>((res) => {
    if (document.readyState === 'complete') return res()
    const fn = () => {
      res()
      window.removeEventListener('load', fn)
    }
    window.addEventListener('load', fn)
  })
}

export function splitArray<T>(arr: T[], count: number): T[][] {
  var result = []
  for (var i = 0; i < arr.length; i += count) {
    result.push(arr.slice(i, i + count))
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isPromiseFunction(fn: Function): boolean {
  return (
    (fn as any).__proto__.constructor ==
    'function AsyncFunction() { [native code] }'
  )
}

export async function wait(time = 0) {
  return new Promise<void>((res) => setTimeout(res, time))
}

type noop = (this: any, ...args: any[]) => any

export function onceCall<T extends noop>(fn: T): T {
  if (isPromiseFunction(fn)) return oncePromise(fn)
  let rs: ReturnType<typeof fn>
  let lastArgs: any
  let hasCall = false

  return ((...args: any[]) => {
    if (!hasCall || !isEqual(args, lastArgs)) {
      hasCall = true
      rs = fn(...args)
    }
    lastArgs = args
    return rs
  }) as T
}

/**包住async函数，让它只会运行一次，之后再调用函数返回的还是第一次运行结果，不会再调用函数 */
export function oncePromise<T extends noop>(fn: T): T {
  let promise: Promise<any>
  let lastArgs: any

  return ((...args: any[]) => {
    if (!promise || !isEqual(args, lastArgs)) {
      promise = new Promise((res, rej) => {
        fn(...args)
          .then(res)
          .catch(rej)
      })
    }
    lastArgs = args
    return promise
  }) as T
}

export function createElement<T extends HTMLElement>(
  tag: keyof HTMLElementTagNameMap,
  op?: // | Partial<T>
  Partial<Omit<T, 'style'>> & {
    style?: CSSStyleDeclaration | string
    [k: string]: any
  }
): T {
  let el = document.createElement(tag)
  Object.assign(el, op)
  return el as T
}

export let minmax = (v: number, min = v, max = v): number =>
  v < min ? min : v > max ? max : v

export function formatTime(time: number, hasMs?: boolean): string {
  let min = ~~(time / 60),
    sec = ~~(time % 60),
    hours = ~~(min / 60)
  if (min >= 60) min = ~~(min % 60)

  let sh = hours ? hours + ':' : '',
    sm = (hours ? (min + '').padStart(2, '0') : min + '') + ':',
    ss = (sec + '').padStart(2, '0'),
    ms = hasMs
      ? `.${(+Math.abs(~~time - time).toFixed(1) * 10 + '')[0] || '0'}`
      : ''
  return sh + sm + ss + ms
}

/**onceCall变种，会记住所有传的args，所有args的地址/简单数据相同返回的数据都是相同的 */
export function onceCallWithMap<T extends noop>(fn: T): T {
  const rootMap = new WeakMap()
  const unObjMap = new Map()
  const noArgsSymbol = Symbol()
  const getKey = (key: any) => {
    if (key instanceof Object) return key
    if (!unObjMap.has(key)) unObjMap.set(key, Symbol())
    return unObjMap.get(key)
  }

  const getMapRs = (keys: any[], map: WeakMap<any, any>): any => {
    const key = getKey(keys.shift())
    if (!map.has(key)) throw Error()
    const val = map.get(key)
    if (val instanceof WeakMap) return getMapRs(keys, val)
    return val
  }
  const setMapRs = (keys: any[], map: WeakMap<any, any>, rs: any): void => {
    const key = getKey(keys.shift())
    if (!map.has(key)) {
      if (keys.length) {
        const newMap = new WeakMap()
        map.set(key, newMap)
        return setMapRs(keys, newMap, rs)
      } else {
        map.set(key, rs)
      }
    }
  }

  return ((...args: any[]) => {
    try {
      if (!args.length) return getMapRs([noArgsSymbol], rootMap)
      const rs = getMapRs([...args], rootMap)
      return rs
    } catch (error) {
      const rs = fn(...args)
      if (!args.length) setMapRs([noArgsSymbol], rootMap, rs)
      else setMapRs([...args], rootMap, rs)
      return rs
    }
  }) as T
}

export function addEventListener<
  T extends {
    addEventListener: (k: string, fn: noop, ...more: any[]) => void
    removeEventListener: (k: string, fn: noop, ...more: any[]) => void
  }
>(target: T, fn: (target: T) => void): () => void {
  const _addEventListener = target.addEventListener

  // eslint-disable-next-line @typescript-eslint/ban-types
  const fnMap: Rec<(Function | { fn: Function; more: any[] })[]> = {}
  target.addEventListener = (key: string, fn: noop, ...more: any[]) => {
    fnMap[key] = fnMap[key] ?? []
    if (more.length) {
      fnMap[key].push({ fn, more })
    } else fnMap[key].push(fn)
    _addEventListener.call(target, key, fn, ...more)
  }
  fn(target)
  target.addEventListener = _addEventListener

  return () => {
    Object.entries(fnMap).forEach(([key, fns]) => {
      fns.forEach((fn) => {
        if (typeof fn == 'function')
          target.removeEventListener.call(target, key, fn)
        else target.removeEventListener.call(target, key, fn.fn, ...fn.more)
      })
    })
  }
}

export function getTopWindow() {
  let nowWindow: Window = window
  while (true) {
    if (parent != nowWindow) nowWindow = parent
    else return nowWindow
  }
}
