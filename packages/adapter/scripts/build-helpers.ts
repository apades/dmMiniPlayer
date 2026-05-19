import * as url from 'url'
import path from 'path'
import { ATTR_INJECT_PERMISSIONS } from '@root/shared/config'
import { AdapterScriptDefinition } from '../core'

const ADAPTER_PRESET_SETTINGS = ['name', 'match', 'injectPermissions'] as const

export async function getSiteAdapterPresetSettings(filePath: string) {
  const moduleUrl = `${url.pathToFileURL(filePath).href}?t=${Date.now()}`
  const module = await import(moduleUrl)

  async function functionWrapper() {
    // Unique query avoids ESM loader cache so preset metadata reloads on rebuild.
    // TODO do not use cache
    // 现在import还是旧的问题
    const defaultExport = module.default

    return ADAPTER_PRESET_SETTINGS.reduce(
      (acc, key) => {
        ;(acc as any)[key] = defaultExport[key]
        return acc
      },
      {} as Pick<
        AdapterScriptDefinition<any>,
        (typeof ADAPTER_PRESET_SETTINGS)[number]
      >,
    )
  }
  return {
    ...(await functionWrapper()),
    hasInject: !!module.inject,
  }
}

/** Relative import path for esbuild entry stubs (does not resolve file:// URLs). */
export function toRelativeImportPath(fromDir: string, targetPath: string) {
  let relative = path.relative(fromDir, targetPath).replaceAll('\\', '/')
  if (!relative.startsWith('.')) {
    relative = `./${relative}`
  }
  return relative
}

export function getSiteAdapterInjectCode(filePath: string, fromDir: string) {
  const importPath = toRelativeImportPath(fromDir, filePath)
  return `import { inject } from '${importPath}'
    inject()`
}

export function getSiteAdapterDefaultExportCode(
  filePath: string,
  fromDir: string,
) {
  const importPath = toRelativeImportPath(fromDir, filePath)
  return `export { default } from '${importPath}'
  `
}

export function getSiteAdapterPresetSettingsCode(
  presetSettings: Awaited<ReturnType<typeof getSiteAdapterPresetSettings>>,
) {
  function main() {
    const permissions = new Set()
    if (document.documentElement.hasAttribute(ATTR_INJECT_PERMISSIONS)) {
      document.documentElement
        .getAttribute(ATTR_INJECT_PERMISSIONS)
        ?.split(',')
        .forEach((permission) => {
          permissions.add(permission)
        })
    }
    presetSettings.injectPermissions?.forEach((permission) => {
      permissions.add(permission)
    })
    document.documentElement.setAttribute(
      ATTR_INJECT_PERMISSIONS,
      Array.from(permissions).join(','),
    )
  }

  return `
  ;(${main
    .toString()
    .replaceAll('ATTR_INJECT_PERMISSIONS', `"${ATTR_INJECT_PERMISSIONS}"`)
    .replaceAll(
      'presetSettings.injectPermissions',
      JSON.stringify(presetSettings.injectPermissions ?? []),
    )})()
  `
}
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
export const OFFICIAL_ADAPTER_CONFIG_FILE = path.resolve(
  __dirname,
  '../dist/config.json',
)
