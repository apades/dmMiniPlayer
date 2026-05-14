import { Nullable } from '@root/utils/typeUtils'
import { EventHandler } from './helpers'

export type InjectSetupContext = {} & EventHandler

type InjectDefinition = {
  name: string
  setup: (ctx: InjectSetupContext) => Nullable
}

export function defineInject(config: InjectDefinition): InjectDefinition {
  return config
}
