import {
  extractFeatures,
  featuresToSelector,
  intersectFeatures,
} from './features'
import { isNoisyClass, isPickerUi } from './utils'

export function queryHtml(root: ParentNode, selector: string): HTMLElement[] {
  if (!selector) return []
  try {
    return [...root.querySelectorAll(selector)].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !isPickerUi(el),
    )
  } catch {
    return []
  }
}

function nodePart(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase()
  if (tag === 'html' || tag === 'body') return tag
  const classes = [...el.classList].filter((name) => !isNoisyClass(name))
  return `${tag}${classes.map((name) => `.${CSS.escape(name)}`).join('')}`
}

function localSelector(el: HTMLElement): string {
  if (el.id) return `#${CSS.escape(el.id)}`
  const part = nodePart(el)
  const parent = el.parentElement
  if (!parent) return part
  const matched = queryHtml(parent, `:scope > ${part}`)
  if (matched.length === 1 && matched[0] === el) return part
  const index = [...parent.children].indexOf(el) + 1
  return `${part}:nth-child(${index})`
}

export function uniqueCssSelector(el: HTMLElement): string {
  const root = el.ownerDocument
  if (el.id) {
    const idSel = `#${CSS.escape(el.id)}`
    if (queryHtml(root, idSel).length === 1) return idSel
  }

  const parts: string[] = []
  let current: HTMLElement | null = el
  while (current && current.tagName !== 'HTML') {
    parts.unshift(localSelector(current))
    const selector = parts.join(' > ')
    const matched = queryHtml(root, selector)
    if (matched.length === 1 && matched[0] === el) return selector
    current = current.parentElement
  }
  return parts.join(' > ')
}

function listFeatures(el: HTMLElement) {
  return extractFeatures(el).filter((feature) => feature.kind !== 'attr')
}

function childListPart(elements: HTMLElement[]): string {
  if (!elements.length) return ''
  return featuresToSelector(intersectFeatures(elements.map(listFeatures)))
}

function sharedParent(elements: HTMLElement[]): HTMLElement | null {
  if (!elements.length) return null
  const parent = elements[0].parentElement
  if (!parent || parent.tagName === 'HTML') return null
  return elements.every((el) => el.parentElement === parent) ? parent : null
}

function sameTagSiblings(seed: HTMLElement): HTMLElement[] {
  const parent = seed.parentElement
  if (!parent) return [seed]
  let group = [...parent.children].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.tagName === seed.tagName,
  )
  const seedClasses = [...seed.classList].filter((name) => !isNoisyClass(name))
  if (seedClasses.length) {
    const shared = group.filter((el) =>
      seedClasses.some((name) => el.classList.contains(name)),
    )
    if (shared.length > 1) group = shared
  }
  return group
}

function isSiblingGroup(seed: HTMLElement, group: HTMLElement[]): boolean {
  const parent = seed.parentElement
  if (!parent || group.length <= 1) return false
  const kids = [...parent.children].filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  )
  if (group.length === kids.length) return true
  const classes = [...seed.classList].filter((name) => !isNoisyClass(name))
  return (
    classes.length > 0 &&
    group.every((el) => classes.some((name) => el.classList.contains(name)))
  )
}

export function commonFeatureSelector(elements: HTMLElement[]): string {
  if (!elements.length) return ''
  const common = intersectFeatures(elements.map(listFeatures))
  if (!common.some((feature) => feature.kind === 'class')) return ''
  return featuresToSelector(common)
}

export function siblingListSelector(elements: HTMLElement[]): string {
  const parent = sharedParent(elements)
  if (!parent) return ''
  const childPart = childListPart(elements)
  if (!childPart) return ''
  return `${uniqueCssSelector(parent)} > ${childPart}`
}

export function listBaseSelector(elements: HTMLElement[]): string {
  return siblingListSelector(elements) || commonFeatureSelector(elements)
}

export function inferListSelection(seed: HTMLElement): {
  selector: string
  elements: HTMLElement[]
} {
  let current: HTMLElement | null = seed
  while (current && current.tagName !== 'BODY' && current.tagName !== 'HTML') {
    const group = sameTagSiblings(current)
    if (isSiblingGroup(current, group)) {
      const selector = siblingListSelector(group)
      if (selector) {
        const matched = queryHtml(seed.ownerDocument, selector)
        const elements = matched.includes(current)
          ? matched
          : [current, ...matched]
        return { selector, elements }
      }
    }
    current = current.parentElement
  }

  const selector = commonFeatureSelector([seed])
  if (!selector) return { selector: '', elements: [seed] }
  const matched = queryHtml(seed.ownerDocument, selector)
  const elements = matched.includes(seed) ? matched : [seed, ...matched]
  return { selector, elements }
}

export function selectorWithNotClasses(
  selector: string,
  classes: string[],
): string {
  if (!selector) return ''
  const nots = [...new Set(classes)]
    .map((name) => `:not(.${CSS.escape(name)})`)
    .join('')
  return `${selector}${nots}`
}

export function listSelectorExcluding(
  kept: HTMLElement[],
  negatives: HTMLElement[],
  root: ParentNode,
): string {
  if (!kept.length) return ''
  let selector = listBaseSelector(kept)
  if (!selector) return ''

  const unwanted = (el: HTMLElement) =>
    !kept.includes(el) || negatives.includes(el)

  const extras = queryHtml(root, selector).filter(unwanted)
  if (!extras.length) return selector

  const notClasses = extras
    .flatMap((el) => [...el.classList])
    .filter((name) => kept.every((item) => !item.classList.contains(name)))
  if (!notClasses.length) return ''

  selector = selectorWithNotClasses(selector, notClasses)
  const matched = queryHtml(root, selector)
  if (!kept.every((el) => matched.includes(el))) return ''
  if (matched.some(unwanted)) return ''
  return selector
}
