/**
 * 将所有的dom事件方法重写
 */

import { onMessage_inject } from './injectListener'

let originalAdd = HTMLElement.prototype.addEventListener

HTMLElement.prototype.addEventListener = function (...val: any) {
  this.eventMap = this.eventMap || {}
  this.eventMap[val[0]] = this.eventMap[val[0]] || []
  let eventList = this.eventMap[val[0]]
  try {
    var rs = originalAdd.call(this, ...val)
    eventList.push({
      fn: val[1],
      state: val[2],
    })
  } catch (error) {
    console.error(error)
  }
  return rs
}

let originalRemove = HTMLElement.prototype.removeEventListener

HTMLElement.prototype.removeEventListener = function (...val: any) {
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

onMessage_inject('event-hacker:disable', ({ qs, event }) => {
  let el = document.querySelector(qs)

  if (!el) throw new Error(`没有找到${qs}的dom`)
  let eventList = (el as any).eventMap?.[event] ?? []

  eventList.forEach((ev: any) => {
    if (ev.state) originalRemove.call(el, ev.fn, ev.state)
    else originalRemove.call(el, ev.fn)
  })
})
