import { wait } from '@root/utils'
import { onMessage, sendMessage } from '../contentSender'

onMessage('inject-api:onTrigger', (data) => {
  if (data?.event != 'history') return null
  console.log('切换了路由 history')

  wait(0).then(() => {
    callbacks.forEach((cb) => cb(location.pathname))
  })
})
window.addEventListener('popstate', () => {
  console.log('切换了路由 popstate')
  callbacks.forEach((cb) => cb(location.pathname))
})

const callbacks: ((pathname: string) => void)[] = []
/**
 * @returns {Function} 取消监听onRouteChange
 */
export default function onRouteChange(callback: (pathname: string) => void) {
  callbacks.push(callback)
  const unListen = () => {
    callbacks.slice(callbacks.findIndex((c) => c == callback))
  }

  return unListen
}
