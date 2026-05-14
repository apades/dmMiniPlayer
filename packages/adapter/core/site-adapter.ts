import { PlayerComponentsConfig } from '@root/core/player-component'
import { type modules } from '@pkgs/injection/entry/client'

export type AdapterInjectPermission = keyof typeof modules

export type AdapterScriptDefinition<InjectPer extends AdapterInjectPermission> =
  {
    name: string
    match: string | string[]
    setup?: (context: AdapterSetupContext<InjectPer>) => void | Promise<void>
    /** @default 'document_end' */
    injectPermissions?: InjectPer[]
    components?:
      | PlayerComponentsConfig
      | ((context: AdapterSetupContext<InjectPer>) => PlayerComponentsConfig)
    onBeforePlayerMounted?: (
      context: AdapterSetupContext<InjectPer>,
    ) => void | Promise<void>
    onPlayerMounted?: (
      context: AdapterSetupContext<InjectPer>,
    ) => void | Promise<void>
    onMediaUpdated?: (
      context: AdapterSetupContext<InjectPer>,
    ) => void | Promise<void>
    onPlayerDestroyed?: (
      context: AdapterSetupContext<InjectPer>,
    ) => void | Promise<void>
  }

export type AdapterSetupContext<InjectPer extends AdapterInjectPermission> = {
  // initDanmakuSender: (instance?: DanmakuSender) => DanmakuSender
  // initDanmakuManager: (instance: DanmakuEngine) => DanmakuEngine
  // initSubtitleManager: (instance?: SubtitleManager) => SubtitleManager
  // useExtension: (name: AdapterExtensionPermission) => void
  // runtime: AdapterRuntimeState
  injection: {
    [K in InjectPer]: ReturnType<(typeof modules)[K]['setup']>
  }
}

export function defineSiteAdapter<InjectPer extends AdapterInjectPermission>(
  definition: AdapterScriptDefinition<InjectPer>,
): AdapterScriptDefinition<InjectPer> {
  return definition
}
