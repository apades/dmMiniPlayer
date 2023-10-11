/**
 * 将所有的dom事件方法重写达到禁用所有event效果
 */

console.log('💀 event hacker running')
import { dq1, type noop } from '@root/utils'
import { onMessage_inject, sendMessage_inject } from './injectListener'

let disableMap: Record<string, string[]> = {}
function injectEventListener<
  T extends {
    addEventListener: (k: string, fn: noop, ...more: any[]) => void
    removeEventListener: (k: string, fn: noop, ...more: any[]) => void
  }
>(tar: T) {
  let originalAdd = tar.addEventListener

  const isDocOrWin = (key: string) =>
    ((tar as any) == window && key == 'window') ||
    ((tar as any) == document && key == 'document')

  tar.addEventListener = function (...val: any) {
    this.eventMap = this.eventMap || {}
    this.eventMap[val[0]] = this.eventMap[val[0]] || []
    let eventList = this.eventMap[val[0]]
    let event = val[0]
    try {
      // 判断监听触发事件
      let onEventMatch = Object.entries(onEventAddMap).find(
        ([key, val]) => isDocOrWin(key) || this.matches?.(key)
      )
      if (onEventMatch && onEventMatch[1].includes(event)) {
        sendMessage_inject('event-hacker:onEventAdd', {
          qs: onEventMatch[0],
          event,
        })
      }

      let disableMatch = Object.entries(disableMap).find(
        ([key, val]) => isDocOrWin(key) || this.matches?.(key)
      )
      // 判断是否禁用
      if (disableMatch && disableMatch[1].includes(event)) {
        console.log('匹配到禁用query', disableMap, this)
      } else var rs = originalAdd.call(this, ...val)
      eventList.push({
        fn: val[1],
        state: val[2],
      })
    } catch (error) {
      console.error(error)
    }
    return rs
  }

  let originalRemove = tar.removeEventListener

  tar.removeEventListener = function (...val: any) {
    let eventList = this.eventMap?.[val[0]] ?? []
    try {
      var rs = originalRemove.call(this, ...val)
      let index = eventList.findIndex(
        (ev: any) => ev.fn === val[1] && ev.state == val[2]
      )
      eventList.splice(index, 1)
    } catch (error) {
      console.error(error)
    }
    return rs
  }

  return {
    originalRemove,
    originalAdd,
  }
}

const domEv = injectEventListener(HTMLElement.prototype)
const docEv = injectEventListener(document)
const winEv = injectEventListener(window)

onMessage_inject('event-hacker:disable', ({ qs, event }) => {
  console.log('开始禁用事件', qs, event)
  disableMap[qs] = disableMap[qs] || []
  disableMap[qs].push(event)

  function rmEv(tar: any, fn: noop) {
    let eventList = (tar as any).eventMap?.[event] ?? []
    eventList.forEach((ev: any) => {
      if (ev.state) fn.call(tar, event, ev.fn, ev.state)
      else fn.call(tar, event, ev.fn)
    })
  }
  switch (qs) {
    case 'window': {
      rmEv(window, winEv.originalRemove)
      break
    }
    case 'document': {
      rmEv(document, docEv.originalRemove)
      break
    }
    default: {
      const el = dq1(qs)
      if (!el)
        return console.warn(`没有找到${qs}的dom，将会在后续dom添加时不给add`)
      rmEv(dq1(qs), domEv.originalRemove)
    }
  }
})

onMessage_inject('event-hacker:enable', ({ qs, event }) => {
  console.log('开始启用事件', qs, event)
  if (!disableMap[qs]) return false
  disableMap[qs].slice(
    disableMap[qs].findIndex((e) => e == event),
    1
  )
  function addEv(tar: any, fn: noop) {
    let eventList = (tar as any).eventMap?.[event] ?? []
    eventList.forEach((ev: any) => {
      if (ev.state) fn.call(tar, event, ev.fn, ev.state)
      else fn.call(tar, event, ev.fn)
    })
  }

  switch (qs) {
    case 'window': {
      addEv(window, winEv.originalAdd)
      break
    }
    case 'document': {
      addEv(document, docEv.originalAdd)
      break
    }
    default: {
      addEv(dq1(qs), domEv.originalAdd)
    }
  }
  return true
})

let onEventAddMap: Record<string, string[]> = {}
onMessage_inject('event-hacker:listenEventAdd', ({ qs, event }) => {
  onEventAddMap[qs] = onEventAddMap[qs] || []
  onEventAddMap[qs].push(event)
})
