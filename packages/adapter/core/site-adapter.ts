import DanmakuEngine from '@root/core/danmaku/DanmakuEngine/DanmakuEngine'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import SubtitleManager from '@root/core/SubtitleManager'
import { PlayerComponentsConfig } from '@root/core/player-component'
import {
  ADAPTER_EXTENSION_PERMISSIONS,
  AdapterExtensionPermission,
} from './extensions'

export { DanmakuEngine as DanmakuManager, DanmakuSender, SubtitleManager }
export { ADAPTER_EXTENSION_PERMISSIONS } from './extensions'

export const ADAPTER_MANAGER_PERMISSIONS = [
  'DanmakuSender',
  'DanmakuManager',
  'SubtitleManager',
] as const

export const ADAPTER_INJECT_PERMISSIONS = [
  'runCode',
  'domEventListener',
  'spaRouteChange',
  'fetch',
  'visibilityState',
  // 'createElement',
] as const

export type AdapterManagerPermission =
  (typeof ADAPTER_MANAGER_PERMISSIONS)[number]

export type AdapterInjectPermission =
  (typeof ADAPTER_INJECT_PERMISSIONS)[number]

export type AdapterScriptDefinition = {
  name: string
  setup?: (context: AdapterSetupContext) => void | Promise<void>
  /** @default 'document_end' */
  run_at?: 'document_start' | 'document_end' | 'document_idle'
  injectPermissions?: AdapterInjectPermission[]
  components?: PlayerComponentsConfig
  onPlayerMounted?: () => void | Promise<void>
  onMediaUpdated?: () => void | Promise<void>
  onPlayerUnmounted?: () => void | Promise<void>
}

export type SiteAdapterModule = {
  regexSite: string
  default: AdapterScriptDefinition
}

type AdapterRuntimeState = {
  managers: Partial<{
    DanmakuSender: DanmakuSender
    DanmakuManager: DanmakuEngine
    SubtitleManager: SubtitleManager
  }>
  initializedManagers: Set<AdapterManagerPermission>
  usedExtensions: Set<AdapterExtensionPermission>
}

export type AdapterSetupContext = {
  initDanmakuSender: (instance?: DanmakuSender) => DanmakuSender
  initDanmakuManager: (instance: DanmakuEngine) => DanmakuEngine
  initSubtitleManager: (instance?: SubtitleManager) => SubtitleManager
  useExtension: (name: AdapterExtensionPermission) => void
  runtime: AdapterRuntimeState
}

export type SiteAdapterBundleItem = {
  id: string
  regexSite: string
  matcher: RegExp
  definition: AdapterScriptDefinition
  setup?: AdapterScriptDefinition['setup']
  permissions: {
    managers: AdapterManagerPermission[]
    extensions: AdapterExtensionPermission[]
  }
}

const permissionSet = new Set(ADAPTER_MANAGER_PERMISSIONS)
const extensionSet = new Set(ADAPTER_EXTENSION_PERMISSIONS)

export function defineSiteAdapter(
  definition: AdapterScriptDefinition,
): AdapterScriptDefinition {
  return definition
}

export function createSiteAdapterBundle(
  modules: Record<string, SiteAdapterModule>,
): SiteAdapterBundleItem[] {
  return Object.entries(modules).map(([id, module]) => {
    const definition = defineSiteAdapter(module.default)
    const regexSite = module.regexSite ?? definition.match
    if (!regexSite) {
      throw new Error(`[adapter] Missing regexSite export in "${id}"`)
    }

    return {
      id,
      regexSite,
      matcher: new RegExp(regexSite),
      definition,
      setup: definition.setup,
      permissions: {
        managers: definition.permissions?.managers ?? [],
        extensions: definition.permissions?.extensions ?? [],
      },
    }
  })
}

export function pickMatchedAdapters(
  url: string,
  bundle: SiteAdapterBundleItem[],
): SiteAdapterBundleItem[] {
  return bundle.filter((item) => item.matcher.test(url))
}

export async function runAdapterSetup(adapter: SiteAdapterBundleItem) {
  const runtime = createRuntimeState()
  const context: AdapterSetupContext = {
    initDanmakuSender(instance = new DanmakuSender()) {
      runtime.managers.DanmakuSender = instance
      runtime.initializedManagers.add('DanmakuSender')
      return instance
    },
    initDanmakuManager(instance) {
      runtime.managers.DanmakuManager = instance
      runtime.initializedManagers.add('DanmakuManager')
      return instance
    },
    initSubtitleManager(instance = new SubtitleManager()) {
      runtime.managers.SubtitleManager = instance
      runtime.initializedManagers.add('SubtitleManager')
      return instance
    },
    useExtension(name) {
      if (!extensionSet.has(name)) {
        throw new Error(`[adapter] Unsupported extension permission "${name}"`)
      }
      runtime.usedExtensions.add(name)
    },
    runtime,
  }

  await adapter.setup?.(context)

  const initializedManagers =
    adapter.permissions.managers.length > 0
      ? adapter.permissions.managers
      : [...runtime.initializedManagers]
  const usedExtensions =
    adapter.permissions.extensions.length > 0
      ? adapter.permissions.extensions
      : [...runtime.usedExtensions]

  return {
    id: adapter.id,
    regexSite: adapter.regexSite,
    initializedManagers,
    usedExtensions,
    runtime,
  }
}

export function createAdapterLoader(bundle: SiteAdapterBundleItem[]) {
  return {
    match(url: string) {
      return pickMatchedAdapters(url, bundle)
    },
    async load(url: string) {
      const matched = pickMatchedAdapters(url, bundle)
      const results = await Promise.all(
        matched.map((item) => runAdapterSetup(item)),
      )
      return {
        matched,
        results,
      }
    },
  }
}

function createRuntimeState(): AdapterRuntimeState {
  return {
    managers: {},
    initializedManagers: new Set<AdapterManagerPermission>(),
    usedExtensions: new Set<AdapterExtensionPermission>(),
  }
}

function validatePermissions(
  permissions: AdapterScriptDefinition['permissions'] | undefined,
) {
  permissions?.managers?.forEach((permission) => {
    if (!permissionSet.has(permission)) {
      throw new Error(
        `[adapter] Unsupported manager permission "${permission}"`,
      )
    }
  })
  permissions?.extensions?.forEach((permission) => {
    if (!extensionSet.has(permission)) {
      throw new Error(
        `[adapter] Unsupported extension permission "${permission}"`,
      )
    }
  })
}
