import type { initInjector } from '@apad/injector/injector'

type config = Parameters<typeof initInjector>[0]
const injectConfig: config = {
  domEvents: true,
  triggerEvents: true,
  eval: true,
}

export default injectConfig
