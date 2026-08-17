export const HASH_CLASS_RE = /^(?:[a-z]{1,3}-)?[a-f0-9]{6,}$/i
export const CSS_MODULE_CLASS_RE = /_[a-zA-Z0-9]{5,}$/
export const BACKSLASH_RE = /\\/g
export const DQUOTE_RE = /"/g

const IGNORED_TAGS = new Set([
  'HTML',
  'HEAD',
  'BODY',
  'SCRIPT',
  'STYLE',
  'LINK',
  'META',
])

const IGNORED_ATTRS = new Set([
  'class',
  'style',
  'id',
  'src',
  'href',
  'srcset',
  'alt',
  'title',
  'width',
  'height',
  'value',
  'checked',
  'selected',
  'tabindex',
  'aria-hidden',
])

export function isPickerUi(el: Element): boolean {
  if (el.closest('[data-element-picker]')) return true
  const root = el.getRootNode()
  return (
    root instanceof ShadowRoot &&
    root.host instanceof HTMLElement &&
    root.host.dataset.elementPicker != null
  )
}

export function isPickable(el: EventTarget | null): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    !IGNORED_TAGS.has(el.tagName) &&
    !isPickerUi(el)
  )
}

export function toPickable(el: Element | null): HTMLElement | null {
  let current: Element | null = el
  while (current) {
    if (isPickable(current)) return current
    current = current.parentElement
  }
  return null
}

export function uniqueElements(elements: HTMLElement[]): HTMLElement[] {
  return [...new Set(elements)]
}

export function hostInList(
  el: HTMLElement,
  elements: HTMLElement[],
): HTMLElement | undefined {
  return elements.find((item) => item === el || item.contains(el))
}

export function escapeAttrValue(value: string): string {
  return value.replace(BACKSLASH_RE, '\\\\').replace(DQUOTE_RE, '\\"')
}

export function isNoisyClass(name: string): boolean {
  return HASH_CLASS_RE.test(name) || CSS_MODULE_CLASS_RE.test(name)
}

export function isStableAttr(name: string): boolean {
  if (IGNORED_ATTRS.has(name)) return false
  if (name.startsWith('on')) return false
  if (name.startsWith('data-react')) return false
  if (name.startsWith('data-v-')) return false
  return true
}

export function deepElementFromPoint(
  doc: Document,
  x: number,
  y: number,
): HTMLElement | null {
  let el: Element | null = doc.elementFromPoint(x, y)
  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y)
    if (!inner || inner === el) break
    el = inner
  }
  return toPickable(el)
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait: number,
): T & { cancel: () => void } {
  let timer = 0
  const wrapped = ((...args: Parameters<T>) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => fn(...args), wait)
  }) as T & { cancel: () => void }
  wrapped.cancel = () => window.clearTimeout(timer)
  return wrapped
}
