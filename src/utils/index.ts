import isEqual from 'fast-deep-equal'
import type { CSSProperties } from 'react'
import type { Rec, ValueOf } from './typeUtils'

let el: HTMLSpanElement = null

import _throttle from './feat/throttle'
// export * as debounce from './feat/debounce'

export const throttle = _throttle
export const isNumber = (val: any): val is number => typeof val == 'number'
export const isNull = (val: any): val is null => val == null
export const isArray = (val: any): val is Array<any> => val instanceof Array
export const isString = (val: any): val is string => typeof val == 'string'
export const isObject = (val: any): val is object => typeof val == 'object'
export const isUndefined = (val: any): val is undefined =>
  typeof val == 'undefined'
export const isNone = (val: any): val is null | undefined =>
  isNull(val) || isUndefined(val)

export function omit<T, K extends keyof T>(obj: T, key: K[]): Omit<T, K> {
  let rs = { ...obj }
  key.forEach((k) => delete rs[k])
  return rs
}
export function get<T>(tar: any, key: string, defaultVal?: T): T {
  const keyArr = key.split('.')
  let val = tar
  while (keyArr.length) {
    const key = keyArr.shift()
    if (isUndefined(val[key])) return defaultVal
    val = val[key]
  }
  return val
}

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
  // TODO waitLoopCallback高级option
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

export const dq: {
  <K extends keyof HTMLElementTagNameMap>(
    selectors: K,
    tar?: Document | ValueOf<HTMLElementTagNameMap> | Element
  ): HTMLElementTagNameMap[K][]
  <K extends keyof SVGElementTagNameMap>(
    selectors: K,
    tar?: Document | ValueOf<SVGElementTagNameMap> | Element
  ): SVGElementTagNameMap[K][]
  <K extends keyof MathMLElementTagNameMap>(
    selectors: K,
    tar?: Document | ValueOf<MathMLElementTagNameMap> | Element
  ): MathMLElementTagNameMap[K][]
  <E extends Element = HTMLDivElement>(
    selectors: string,
    tar?: Document | Element
  ): E[]
} = (selector: string, tar = window.document) => {
  return Array.from(tar.querySelectorAll(selector))
}
export let dq1: {
  <K extends keyof HTMLElementTagNameMap>(
    selectors: K,
    tar?: Document | ValueOf<HTMLElementTagNameMap> | Element
  ): HTMLElementTagNameMap[K] | null
  <K extends keyof SVGElementTagNameMap>(
    selectors: K,
    tar?: Document | ValueOf<SVGElementTagNameMap> | Element
  ): SVGElementTagNameMap[K] | null
  <E extends Element = HTMLDivElement>(
    selectors: string,
    tar?: Document | Element
  ): E | null
} = (selector: string, tar = window.document) => {
  let dom = tar.querySelector(selector)
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

export type noop = (this: any, ...args: any[]) => any

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
export const clamp = minmax

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

export function formatView(view: number): string {
  const b = view / 1_000_000
  if (b >= 1) return b.toFixed(2) + 'b'
  const k = view / 1_000
  if (k >= 1) return k.toFixed(2) + 'k'
  return view + ''
}

/**过滤数组，callback里返回true的都放在[left,right]的left里，其余的在right */
export function filterList<T>(
  list: T[],
  callback: (data: T) => boolean
): [T[], T[]] {
  let left: T[] = [],
    right: T[] = []
  list.forEach((l) => {
    let v = callback(l)
    v ? left.push(l) : right.push(l)
  })
  return [left, right]
}

export function getClientRect<T extends HTMLElement>(
  dom: T
): DOMRect | undefined {
  let rect: DOMRect | undefined
  try {
    rect = dom?.getClientRects()[0]
  } catch (error) {
    console.error('some error', error)
  }
  return rect
}

export function inputFile(accept = '*') {
  return new Promise<File>((resolve, reject) => {
    const input = createElement<HTMLInputElement>('input', {
      type: 'file',
      accept,
      onchange: (e) => {
        resolve(input.files[0])
      },
    })

    input.click()
  })
}

export async function readTextFromFile(file: File) {
  const fileReader = new FileReader()
  fileReader.readAsText(file)
  const text = await new Promise<string>((resolve, reject) => {
    fileReader.onload = () => {
      resolve(fileReader.result as string)
    }
  })
  return text
}
