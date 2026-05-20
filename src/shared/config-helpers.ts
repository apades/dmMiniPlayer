import { AdapterScriptDefinition } from '@pkgs/adapter/core'
import {
  ADAPTER_CONFIG_GLOBAL_NAME,
  ATTR_ADAPTER_CONFIG,
  CONTENT_SCRIPTS_INJECTION_CLIENT_NAME,
} from './config'

export function getAdapterConfig(): AdapterScriptDefinition<any, any> {
  return window[ADAPTER_CONFIG_GLOBAL_NAME]
}

export function getContentScriptsInjectionClient() {
  return window[CONTENT_SCRIPTS_INJECTION_CLIENT_NAME]
}

export function getAdapterConfigFromAttribute() {
  return JSON.parse(
    document.documentElement.getAttribute(ATTR_ADAPTER_CONFIG) ?? '{}',
  )
}
