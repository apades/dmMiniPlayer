import { Options } from 'tsup'

export type EsbuildPlugin = Required<Options>['esbuildPlugins'][number]
