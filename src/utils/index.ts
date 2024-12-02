import isEqual from 'fast-deep-equal'
import type { CSSProperties } from 'react'
import type { AsyncFn, Rec, TransStringValToAny, ValueOf } from './typeUtils'

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
    const key = keyArr.shift() ?? ''
    if (isUndefined(val[key])) return defaultVal as T
    val = val[key]
  }
  return val
}

let el: HTMLSpanElement
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

type DqTarType =
  | Document
  | ValueOf<HTMLElementTagNameMap>
  | Element
  | undefined
  | null
export const dq: {
  <K extends keyof HTMLElementTagNameMap>(
    selectors: K,
    tar?: DqTarType
  ): HTMLElementTagNameMap[K][]
  <K extends keyof SVGElementTagNameMap>(
    selectors: K,
    tar?: DqTarType
  ): SVGElementTagNameMap[K][]
  <K extends keyof MathMLElementTagNameMap>(
    selectors: K,
    tar?: DqTarType
  ): MathMLElementTagNameMap[K][]
  <E extends Element = HTMLDivElement>(selectors: string, tar?: DqTarType): E[]
} = (selector: string, tar = window.document as DqTarType) => {
  return Array.from(tar?.querySelectorAll(selector) ?? [])
}

export const dq1: {
  <K extends keyof HTMLElementTagNameMap>(selectors: K, tar?: DqTarType):
    | HTMLElementTagNameMap[K]
    | undefined
  <K extends keyof SVGElementTagNameMap>(selectors: K, tar?: DqTarType):
    | SVGElementTagNameMap[K]
    | undefined
  <E extends Element = HTMLDivElement>(selectors: string, tar?: DqTarType):
    | E
    | undefined
} = (selector: string, tar = window.document as DqTarType) => {
  let dom = tar?.querySelector(selector) || undefined
  return dom
}

/**包含iframe内部查找 */
export const dq1Adv: typeof dq1 = (
  selector: string,
  tar = window.document as DqTarType
) => {
  const top = dq1(selector, tar)
  if (top) {
    return top
  }
  for (const iframe of dq('iframe')) {
    try {
      const child = iframe.contentWindow?.document.querySelector(selector)
      if (child) return child as HTMLElement
    } catch (error) {
      //
    }
  }
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

export function createElement<
  T extends HTMLElement,
  TAG extends keyof HTMLElementTagNameMap
>(
  tag: TAG,
  option?: Partial<Omit<T, 'style' | 'dataset' | 'children'>> & {
    /**支持传入number，自动转化成px */
    style?: Partial<TransStringValToAny<CSSStyleDeclaration>> | string
    /**不支持驼峰写法，请传`a-bc`这样，但取的时候是dataset['aBc'] */
    dataset?: Record<string, string | number>
    /**传入子DOM */
    children?: HTMLElement[]
    [k: string]: any
  }
): HTMLElementTagNameMap[typeof tag] {
  const { children, dataset, style, ...op } = { ...option }
  const el = document.createElement(tag)
  Object.assign(el, op)
  if (style) {
    if (isObject(style)) {
      Object.entries(style).forEach(([k, v]) => {
        if (isNumber(v)) {
          v = v + 'px'
        }
        if (isUndefined(v) || isNull(v)) return
        el.style[k as any] = v as any
      })
    } else {
      el.style.cssText = style
    }
  }
  if (dataset) {
    Object.entries(dataset).forEach(([key, val]) => {
      el.setAttribute(`data-${key}`, val + '')
    })
  }
  if (children) {
    children.forEach((c) => {
      el.appendChild(c)
    })
  }
  return el
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
          target.removeEventListener.call(target, key, fn as any)
        else
          target.removeEventListener.call(target, key, fn.fn as any, ...fn.more)
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
    const input = createElement('input', {
      type: 'file',
      accept,
      onchange: (e) => {
        if (input.files) {
          resolve(input.files[0])
        }
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

export const onceLog = onceCall((...e: any) => {
  console.log(...e)
})
export function getDeepPrototype<T = any>(from: any, equal: T): T | null {
  const root = Object.getPrototypeOf(from)
  if (!root) return null
  if (root.constructor === equal) return from
  return getDeepPrototype(root, equal)
}

export function ownerWindow(node: Node | null | undefined): Window {
  const doc = ownerDocument(node)
  return doc.defaultView || window
}

export function ownerDocument(node: Node | null | undefined): Document {
  return (node && node.ownerDocument) || document
}

export function getPrototypeSetter<T>(obj: T, key: keyof T) {
  const setter = Object.getOwnPropertyDescriptor(obj, key)?.set

  if (!setter) {
    const prototype = Object.getPrototypeOf(obj)
    if (!prototype) {
      return null
    }
    return getPrototypeSetter(prototype, key)
  }

  return setter
}

export function getPrototypeGetter<T>(obj: T, key: keyof T) {
  const getter = Object.getOwnPropertyDescriptor(obj, key)?.get

  if (!getter) {
    const prototype = Object.getPrototypeOf(obj)
    if (!prototype) {
      return null
    }
    return getPrototypeGetter(prototype, key)
  }

  return getter
}

/** 多次请求时，如果上一个还没结束，这次的promise会覆盖上一个的promise请求 */
export function switchLatest<Args extends readonly unknown[], Return>(
  asyncFn: AsyncFn<Args, Return>
) {
  let lastKey: symbol
  return async function (...args: Args): Promise<Return> {
    return new Promise((res, rej) => {
      const key = (lastKey = Symbol())
      asyncFn(...args).then(
        (data) => lastKey === key && res(data),
        (err) => lastKey === key && rej(err)
      )
    })
  }
}

export function getAnyObjToString(obj: any) {
  if (typeof obj?.toString === 'function') {
    return obj.toString()
  }
  return ''
}

export function newArray(len: number, fill = null) {
  return new Array(len).fill(fill)
}

export function getAllNotSameOriginIframesWindow() {
  return dq('iframe')
    .filter((d) => !d.contentDocument && !!d.contentWindow)
    .map((d) => d.contentWindow!)
}

export { v4 as uuid } from 'uuid'

export function tryCatch<Return>(
  fn: () => Return
): Return extends Promise<any>
  ? Promise<[undefined, Awaited<Return>] | [Error, undefined]>
  : [undefined, Return] | [Error, undefined] {
  try {
    const rs: any = fn()
    if (rs instanceof Promise) {
      return rs
        .then((d) => [undefined, d])
        .catch((err) => [err, undefined]) as any
    } else {
      return [undefined, rs] as any
    }
  } catch (error) {
    return [error as Error, undefined] as any
  }
}

export const objectKeys = <T>(obj: Record<string, T>) =>
  Object.keys(obj) as (keyof T)[]

export const canAccessTop = () => !tryCatch(() => top!.document)[0]
