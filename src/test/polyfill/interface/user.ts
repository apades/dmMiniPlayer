import '../../src/content-script/quick-query'
// import '../../src/content-script/search-results'
import _env from '../env'
import { dispatchMessage } from '../message'
import './userBrowserAPIMessageHandler'

// if (location.hostname) {
//   import('../../src/content-script/search-results')
// }

if (_env.platform == 'web') {
  window.addEventListener('message', (e) => {
    const data = e.data
    if (data.title === 'browser-API') {
      dispatchMessage(data.title, data.content)
    }
  })
}
