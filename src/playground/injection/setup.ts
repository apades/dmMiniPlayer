import { createInjectionClient } from '@pkgs/injection/entry/client'
import { createInjectionInject } from '@pkgs/injection/entry/inject'

export type InjectionModule = 'fetch' | 'runCode' | 'visibility'

export function bootstrapInjection(modules: InjectionModule[]) {
  createInjectionInject({ enabledModules: modules })
  return createInjectionClient({ enabledModules: modules })
}
