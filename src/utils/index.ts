import { isNumber, isNull } from 'lodash-es'
import { CSSProperties } from 'react'
import AsyncLock from './AsyncLock'

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
  (cb: () => boolean /* | Promise<boolean> */, limitTime?: number): Promise<
    boolean
  >
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
export const ascendingSort = <T>(itemProp: (obj: T) => number = selfSorter) => (
  a: T,
  b: T
) => itemProp(a) - itemProp(b)

export let dq: typeof document.querySelectorAll = (selector: string) => {
  return document.querySelectorAll(selector)
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

const windowLoadAsync = new AsyncLock()
export const onWindowLoad = () => {
  if (document.readyState === 'complete') return
  return windowLoadAsync.waiting
}
window.addEventListener('load', () => windowLoadAsync.ok)

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
