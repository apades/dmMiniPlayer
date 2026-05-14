// import { injectFunction } from '@root/utils/injectFunction'
// import { get } from '@root/utils'
// import { onMessage_inject, sendMessage_inject } from './injectListener'
// import './eventHacker'
// import './createElementHacker'
import { createInjectionInject } from '@pkgs/injection/entry/inject'
import { ATTR_INJECT_PERMISSIONS } from '@root/shared/config'
import './netflix'
// import './fetchHacker'

const inject = createInjectionInject({
  enabledModules:
    (document.documentElement
      .getAttribute(ATTR_INJECT_PERMISSIONS)
      ?.split(',') as any) ?? [],
})

window.__$injectionInject = inject
