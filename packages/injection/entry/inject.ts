import { tryCatch } from '@root/utils'
import { createMessager } from '@root/utils/Messager'
import { runCodeInject } from '../modules/run-code/inject'
import { visibilityInject } from '../modules/visibility/inject'
import { fetchInject } from '../modules/fetch/inject'

const { offMessage, onMessage, onMessageOnce, sendMessage } = createMessager({
  sendType: 'inject-response',
  listenType: 'inject-request',
})

const modules = {
  runCode: runCodeInject,
  visibility: visibilityInject,
  fetch: fetchInject,
} as const

type Inject = Record<
  keyof typeof modules,
  ReturnType<(typeof modules)[keyof typeof modules]['setup']>
>
let client: Inject | null = null

type Config = {
  enabledModules: (keyof typeof modules)[]
}
export function createInjectionInject(config: Config) {
  if (!client) {
    client = config.enabledModules.reduce((acc, moduleKey) => {
      const module = modules[moduleKey]
      if (!module) return acc

      const getName = (name: string) => `${module.name}-${name}`
      const [error, rs] = tryCatch(() =>
        module.setup({
          off: (n, h) => offMessage(getName(n), h),
          on: (n, h) => onMessage(getName(n), h),
          send: (n, ...args) => sendMessage(getName(n), ...args),
        }),
      )
      if (rs) acc[moduleKey] = rs
      return acc
    }, {} as Inject) as Inject
  }

  return client
}
