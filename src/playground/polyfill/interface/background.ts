import _env from '../env'
import { dispatchMessage } from '../message'
import './bgBrowserAPIMessageHandler'

if (_env.platform == 'web') {
  window.addEventListener('message', (e) => {
    const data = e.data
    if (data.title === 'browser-API') {
      dispatchMessage(data.title, data.content)
    }
  })
}
