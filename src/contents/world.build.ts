import { ATTR_DISABLE } from '@root/shared/config'
import { run } from './inject'
;(() => {
  if (document.documentElement.getAttribute(ATTR_DISABLE)) return

  console.log('⚡ run world script')
  // 这里的宏任务竟然可以在body和script标签执行之前执行🤔
  setTimeout(() => {
    run()
  }, 0)
})()
