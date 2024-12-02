import { run } from './inject'
;(() => {
  const extBaseUrl = document.documentElement.getAttribute('dm-url')
  if (document.documentElement.getAttribute('dm-disable')) return

  console.log('⚡ run world script')
  run()
})()
