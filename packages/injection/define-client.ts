import { EventHandler } from './helpers'
export type ClientSetupContext = {} & EventHandler

type ClientDefinition<T extends Record<string, any> = Record<string, any>> = {
  name: string
  setup: (ctx: ClientSetupContext) => T
}

export function defineClient<
  T extends Record<string, any> = Record<string, any>,
>(config: ClientDefinition<T>): ClientDefinition<T> {
  return config
}
