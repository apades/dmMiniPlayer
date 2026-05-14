import { tryCatch } from '@root/utils'
import { createMessager } from '@root/utils/Messager'
import { fetchClient } from '../modules/fetch/client'
import { runCodeClient } from '../modules/run-code/client'
import { visibilityClient } from '../modules/visibility/client'

const { offMessage, onMessage, onMessageOnce, sendMessage } = createMessager({
  listenType: 'inject-response',
  sendType: 'inject-request',
})

export const modules = {
  runCode: runCodeClient,
  visibility: visibilityClient,
  fetch: fetchClient,
} as const

type Client = Record<
  keyof typeof modules,
  ReturnType<(typeof modules)[keyof typeof modules]['setup']>
>
let client: Client | null = null

type Config = {
  enabledModules: (keyof typeof modules)[]
}
export function createInjectionClient(config: Config) {
  if (!client) {
    const enabledModules = config.enabledModules
      .map((module) => modules[module])
      .filter(Boolean) as NonNullable<(typeof modules)[keyof typeof modules]>[]
    client = enabledModules.reduce((acc, module) => {
      const getName = (name: string) => `${module.name}-${name}`
      const [error, rs] = tryCatch(() =>
        module.setup({
          off: (n, h) => offMessage(getName(n), h),
          on: (n, h) => onMessage(getName(n), h),
          send: (n, ...args) => sendMessage(getName(n), ...args),
        }),
      )
      if (rs) acc[module.name as keyof typeof modules] = rs
      return acc
    }, {} as Client) as Client
  }

  return client
}
