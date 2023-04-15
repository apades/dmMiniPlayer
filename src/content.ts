import { getWebProvider } from './web-provider'

console.log('asd')

let scriptEl = document.createElement('script')
scriptEl.src = chrome.runtime.getURL('lib/protobuf.js')
document.body.appendChild(scriptEl)

window.getWebProvider = getWebProvider
