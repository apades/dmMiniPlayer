import onRouteChange from '@root/inject/csUtils/onRouteChange'

export const INTERNAL_ADAPTER_EXTENSIONS = {
  onRouteChange,
} as const

export const ADAPTER_EXTENSION_PERMISSIONS = Object.keys(
  INTERNAL_ADAPTER_EXTENSIONS,
) as (keyof typeof INTERNAL_ADAPTER_EXTENSIONS)[]

export type AdapterExtensionPermission =
  (typeof ADAPTER_EXTENSION_PERMISSIONS)[number]
