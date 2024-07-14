import { onMessage, sendMessage } from '../contentSender'

sendMessage('inject-api:run', {
  origin: 'history',
  keys: ['pushState', 'forward', 'replaceState'],
  onTriggerEvent: 'history',
})
onMessage('inject-api:onTrigger', (data) => {
  if (data.event != 'history') return null
  console.log('切换了路由 history')
  callbacks.forEach((cb) => cb())
})
window.addEventListener('popstate', () => {
  console.log('切换了路由 popstate')
  callbacks.forEach((cb) => cb())
})

const callbacks: (() => void)[] = []
/**
 * @returns {Function} 取消监听onRouteChange
 */
export default function onRouteChange(callback: () => void) {
  callbacks.push(callback)
  const unListen = () => {
    callbacks.slice(callbacks.findIndex((c) => c == callback))
  }

  return unListen
}
