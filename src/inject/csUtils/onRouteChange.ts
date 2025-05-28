import { wait } from '@root/utils'
import Events2 from '@root/utils/Events2'
import { onMessage, sendMessage } from '../contentSender'

onMessage('inject-api:onTrigger', (data) => {
  if (data?.event !== 'history') return null
  console.log('切换了路由 history')

  wait(0).then(() => {
    e.emit('cb', location.pathname)
  })
})
window.addEventListener('popstate', () => {
  console.log('切换了路由 popstate')
  e.emit('cb', location.pathname)
})

const e = new Events2<{ cb: string }>()
// const callbacks: ((pathname: string) => void)[] = []
/**
 * @returns {Function} 取消监听onRouteChange
 */
export default function onRouteChange(callback: (pathname: string) => void) {
  return e.on2('cb', callback)
}
