import {
  ADAPTER_CONFIG_GLOBAL_NAME,
  CONTENT_SCRIPTS_INJECTION_CLIENT_NAME,
} from './config'

export function getAdapterConfig() {
  return window[ADAPTER_CONFIG_GLOBAL_NAME]
}

export function getContentScriptsInjectionClient() {
  return window[CONTENT_SCRIPTS_INJECTION_CLIENT_NAME]
}
