import { getWebProvider } from './web-provider'

console.log('run content')

let provider = getWebProvider()

window.getWebProvider = getWebProvider
window.provider = provider
