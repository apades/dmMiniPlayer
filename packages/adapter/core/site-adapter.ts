import { PlayerComponentsConfig } from '@root/core/player-component'
import { type modules } from '@pkgs/injection/entry/client'
import type { Language } from '@root/utils/i18n'

export type AdapterInjectPermission = keyof typeof modules

interface ConfigFieldBase<T> {
  value: T
  desc?: string
  label?: string
  i18n?: Partial<
    Record<
      Language,
      Partial<{
        label: string
        desc: string
      }>
    >
  >
}
export type ConfigField<T> =
  | ConfigFieldBase<T>
  | T
  | (ConfigFieldBase<T> & {
      type: 'select'
      options: (T | ConfigFieldBase<T>)[]
    })

export type AdapterScriptDefinition<
  InjectPer extends AdapterInjectPermission,
  Config extends Record<string, any>,
> = {
  name: string
  match: string | string[]
  config?: {
    [K in keyof Config]: ConfigField<Config[K]>
  }
  setup?: (
    context: AdapterSetupContext<InjectPer, Config>,
  ) => void | Promise<void>
  /** @default 'document_end' */
  injectPermissions?: InjectPer[]
  components?:
    | PlayerComponentsConfig
    | ((
        context: AdapterSetupContext<InjectPer, Config>,
      ) => PlayerComponentsConfig)
  onBeforePlayerMounted?: (
    context: AdapterSetupContext<InjectPer, Config>,
  ) => void | Promise<void>
  onPlayerMounted?: (
    context: AdapterSetupContext<InjectPer, Config>,
  ) => void | Promise<void>
  onMediaUpdated?: (
    context: AdapterSetupContext<InjectPer, Config>,
  ) => void | Promise<void>
  onPlayerDestroyed?: (
    context: AdapterSetupContext<InjectPer, Config>,
  ) => void | Promise<void>
}

export type AdapterSetupContext<
  InjectPer extends AdapterInjectPermission,
  Config extends Record<string, any> = Record<string, any>,
> = {
  // initDanmakuSender: (instance?: DanmakuSender) => DanmakuSender
  // initDanmakuManager: (instance: DanmakuEngine) => DanmakuEngine
  // initSubtitleManager: (instance?: SubtitleManager) => SubtitleManager
  // useExtension: (name: AdapterExtensionPermission) => void
  // runtime: AdapterRuntimeState
  webVideo: HTMLVideoElement
  config: Config
  injection: {
    [K in InjectPer]: ReturnType<(typeof modules)[K]['setup']>
  }
}

export function defineSiteAdapter<
  InjectPer extends AdapterInjectPermission,
  Config extends Record<string, any>,
>(
  definition: AdapterScriptDefinition<InjectPer, Config>,
): AdapterScriptDefinition<InjectPer, Config> {
  return definition
}
