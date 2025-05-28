import type { Options } from 'tsup'

export type EsbuildPlugin = Required<Options>['esbuildPlugins'][number]
