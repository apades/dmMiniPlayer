import { getPort } from '@plasmohq/messaging/port'
import configStore from '@root/store/config'
import Browser from 'webextension-polyfill'

export function openPerformanceWindow() {
  Browser.windows.create({
    url: Browser.runtime.getURL('/tabs/performance.html'),
    height: 420,
    width: 680,
  })
}

const timeStartMap: Record<string, number> = {}
const dataMap: Record<string, { data: number; label: string; ext?: any }> = {}
export function timeStart(label: string) {
  if (!configStore.performanceInfo) return
  timeStartMap[label] = new Date().getTime()
}

export function timeEnd(label: string, ext?: any) {
  if (!configStore.performanceInfo) return
  const offset = timeStartMap[label] - new Date().getTime()
  dataMap[label] = { data: offset, label, ext }
}

export function addCusData(label: string, data: number, ext?: any) {
  if (!configStore.performanceInfo) return
  dataMap[label] = { data, label, ext }
}

export function sendPerformanceData() {
  if (!configStore.performanceInfo) return
  let port = getPort('cs-performance')
  port.postMessage({
    body: {
      type: 'performance-node',
      dataMap,
    },
  })
}
