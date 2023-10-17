import { initClient } from '@apad/injector/client'
import injectConfig from './injectConfig'

export const injectorClient = initClient(injectConfig)
window.injectorClient = injectorClient
