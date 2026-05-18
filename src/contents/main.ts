import isTop from '@root/shared/isTop'
import './floatButton'
import logger from '@pkgs/logger/ext'
import {
  ADAPTER_CONFIG_GLOBAL_NAME,
  ATTR_INJECT_PERMISSIONS,
} from '@root/shared/config'
import { createInjectionClient } from '@pkgs/injection/entry/client'
import isDev from '@root/shared/isDev'
import { sendMessage } from 'webext-bridge/content-script'
import WebextEvent from '@root/shared/webextEvent'
import { getAdapterConfig } from '@root/shared/config-helpers'
import runOnTopMain from './main/run-on-top'
import runOnAllIframeMain from './main/run-on-all-iframe'

window.isCsEnv = true
// iframe里就不用运行了
if (isTop) {
  // logger.log('run in top window')

  // const logger2 = logger.namespace('test')
  // logger2.log('run in top window namespace')
  runOnTopMain()

  // dev to keep alive
  // if (isDev) {
  //   setInterval(() => {
  //     if (document.visibilityState === 'hidden') return
  //     sendMessage(WebextEvent.keepAlive, null)
  //   }, 1000)
  // }
} else {
  runOnAllIframeMain()
}

const client = createInjectionClient({
  enabledModules:
    (document.documentElement
      .getAttribute(ATTR_INJECT_PERMISSIONS)
      ?.split(',') as any) ?? [],
})
window.__$injectionClient = client

const adapterConfig = getAdapterConfig()
if (adapterConfig) {
  adapterConfig.setup?.({
    injection: client,
  })
}
