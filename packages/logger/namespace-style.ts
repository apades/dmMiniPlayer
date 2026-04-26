const NAMESPACE_COLOR_CACHE = new Map<string, string>()

/**
 * Deterministic HSL color for console %c styling; result is cached per namespace.
 */
export function getNamespaceConsoleColor(namespace: string): string {
  const hit = NAMESPACE_COLOR_CACHE.get(namespace)
  if (hit) return hit

  let hash = 0
  for (let i = 0; i < namespace.length; i++) {
    hash = namespace.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  const s = 62 + (Math.abs(hash >> 7) % 18)
  const l = 48 + (Math.abs(hash >> 14) % 12)
  const color = `hsl(${h}, ${s}%, ${l}%)`
  NAMESPACE_COLOR_CACHE.set(namespace, color)
  return color
}
