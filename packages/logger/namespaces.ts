const namespaceOutputEnabled = new Map<string, boolean>()

/** Enable or disable console + persistence for a specific namespace. */
export function setLoggerNamespaceEnabled(
  namespace: string,
  enabled: boolean,
): void {
  namespaceOutputEnabled.set(namespace, enabled)
}

export function isLoggerNamespaceEnabled(namespace: string): boolean {
  return namespaceOutputEnabled.get(namespace) !== false
}
