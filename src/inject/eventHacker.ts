/**
 * 将所有的dom事件方法重写达到禁用所有event效果
 */

import { dq1, type noop } from '@root/utils'
import equal from 'fast-deep-equal'
import { isUndefined } from 'lodash-es'
import { onMessage_inject, sendMessage_inject } from './injectListener'
import { eventHackerEnableSites } from './eventHacker.config'

function main() {
  console.log('💀 event hacker running')
  let disableMap: Record<string, string[]> = {}
  function injectEventListener<
    T extends {
      addEventListener: (k: string, fn: noop, ...more: any[]) => void
      removeEventListener: (k: string, fn: noop, ...more: any[]) => void
    },
  >(tar: T) {
    let originalAdd = tar.addEventListener

    const isDocOrWin = (key: string) =>
      ((tar as any) == window && key == 'window') ||
      ((tar as any) == document && key == 'document')

    const isWindow = (tar as any) == window
    const isDocument = (tar as any) == document

    tar.addEventListener = function (
      this: any,
      key: string,
      fn: () => void,
      state: any,
    ) {
      const getEventMap = () => {
        if (isWindow) return window.eventMap
        if (isDocument) return (document as any).eventMap
        return this.eventMap
      }

      try {
        if (isWindow) {
          window.eventMap = getEventMap() || {}
          window.eventMap[key] = getEventMap()[key] || []
        } else if (isDocument) {
          ;(document as any).eventMap = getEventMap() || {}
          ;(document as any).eventMap[key] = getEventMap()[key] || []
        } else {
          this.eventMap = getEventMap() || {}
          this.eventMap[key] = getEventMap()[key] || []
        }
      } catch (error) {
        console.error(error, tar)
      }

      let eventList = getEventMap()?.[key] as any[]
      let event = key
      try {
        // 判断监听触发事件
        let onEventMatch = Object.entries(onEventAddMap).find(
          ([key, val]) => isDocOrWin(key) || (tar as any).matches?.(key),
        )
        if (onEventMatch && onEventMatch[1].includes(event)) {
          sendMessage_inject('event-hacker:onEventAdd', {
            qs: onEventMatch[0],
            event: key as any,
          })
        }

        let disableMatch = Object.entries(disableMap).find(
          ([key, val]) => isDocOrWin(key) || this.matches?.(key),
        )
        // 判断是否禁用
        if (disableMatch && disableMatch[1].includes(event)) {
          console.log('匹配到禁用query', disableMap, tar)
        } else {
          var rs = originalAdd.call(this, key, fn, state)
        }
        const addEvent = {
          fn,
          state,
        }
        // 重复挂载事件的情况
        if (eventList.find((ev) => equal(ev, addEvent))) return
        eventList.push(addEvent)
      } catch (error) {
        console.error(error)
      }
      return rs
    }

    let originalRemove = tar.removeEventListener

    tar.removeEventListener = function (
      this: any,
      key: string,
      fn: () => void,
      state: any,
    ) {
      const getEventMap = () => {
        if (isWindow) return window.eventMap
        if (isDocument) return (document as any).eventMap
        return this.eventMap
      }

      try {
        const eventList = getEventMap()?.[key] ?? []
        var rs = originalRemove.call(this, key, fn, state)
        const index = eventList.findIndex(
          (ev: any) => ev.fn === fn && ev.state === state,
        )
        if (index !== -1) {
          eventList.splice(index, 1)
        }
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
        if (!isUndefined(ev.state)) fn.call(tar, event, ev.fn, ev.state)
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
    const index = disableMap[qs].findIndex((e) => e == event)
    if (index !== -1) {
      disableMap[qs].splice(index, 1)
    }

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
}

if (
  eventHackerEnableSites.find((site: any) => {
    const isRegex = site.startsWith('/') && site.endsWith('/')
    if (isRegex)
      return new RegExp(site.match(/^\/(.*)\/$/)[1]).test(window.location.href)
    return window.location.href.includes(site)
  })
) {
  main()
}
