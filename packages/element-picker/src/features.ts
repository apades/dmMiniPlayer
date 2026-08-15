import type { ElementFeature } from './types'
import { escapeAttrValue, isNoisyClass, isStableAttr } from './utils'

export function featureKey(feature: ElementFeature): string {
  if (feature.kind === 'attr') return `attr:${feature.name}=${feature.value}`
  return `${feature.kind}:${feature.value}`
}

export function featureEquals(a: ElementFeature, b: ElementFeature): boolean {
  return featureKey(a) === featureKey(b)
}

export function uniqueFeatures(features: ElementFeature[]): ElementFeature[] {
  const seen = new Set<string>()
  const result: ElementFeature[] = []
  for (const feature of features) {
    const key = featureKey(feature)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(feature)
  }
  return result
}

export function extractFeatures(el: HTMLElement): ElementFeature[] {
  const features: ElementFeature[] = [
    { kind: 'tag', value: el.tagName.toLowerCase() },
  ]

  for (const name of el.classList) {
    if (!isNoisyClass(name)) {
      features.push({ kind: 'class', value: name })
    }
  }

  for (const attr of el.attributes) {
    if (!isStableAttr(attr.name) || !attr.value) continue
    features.push({ kind: 'attr', name: attr.name, value: attr.value })
  }

  return features
}

export function hasFeature(el: HTMLElement, feature: ElementFeature): boolean {
  switch (feature.kind) {
    case 'tag':
      return el.tagName.toLowerCase() === feature.value
    case 'class':
      return el.classList.contains(feature.value)
    case 'attr':
      return el.getAttribute(feature.name) === feature.value
  }
}

export function matchesFeatures(
  el: HTMLElement,
  features: ElementFeature[],
): boolean {
  return features.every((feature) => hasFeature(el, feature))
}

export function intersectFeatures(
  groups: ElementFeature[][],
): ElementFeature[] {
  if (!groups.length) return []
  return groups[0].filter((feature) =>
    groups.every((group) => group.some((item) => featureEquals(item, feature))),
  )
}

export function featuresToSelector(features: ElementFeature[]): string {
  let tag = ''
  const classes: string[] = []
  const attrs: string[] = []

  for (const feature of features) {
    if (feature.kind === 'tag') {
      tag = feature.value
      continue
    }
    if (feature.kind === 'class') {
      classes.push(`.${CSS.escape(feature.value)}`)
      continue
    }
    attrs.push(
      `[${CSS.escape(feature.name)}="${escapeAttrValue(feature.value)}"]`,
    )
  }

  return `${tag}${classes.join('')}${attrs.join('')}`
}

export function queryByFeatures(
  features: ElementFeature[],
  scope: ParentNode,
): HTMLElement[] {
  const selector = featuresToSelector(features)
  if (!selector) return []
  try {
    return [...scope.querySelectorAll(selector)].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    )
  } catch {
    return []
  }
}

function sameTagChildren(parent: HTMLElement, tag: string): HTMLElement[] {
  return [...parent.children].filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.tagName === tag,
  )
}

function commonClasses(elements: HTMLElement[]): string[] {
  if (!elements.length) return []
  const [first, ...rest] = elements
  return [...first.classList].filter(
    (name) =>
      !isNoisyClass(name) && rest.every((el) => el.classList.contains(name)),
  )
}

export function inferListFeatures(seed: HTMLElement): {
  features: ElementFeature[]
  scope: ParentNode
} {
  const parent = seed.parentElement
  const seedFeatures = extractFeatures(seed)

  if (parent) {
    const siblings = sameTagChildren(parent, seed.tagName)
    if (siblings.length > 1) {
      let group = siblings
      const shared = commonClasses(siblings)
      if (!shared.length && seed.classList.length) {
        group = siblings.filter((el) =>
          [...seed.classList].some((name) => el.classList.contains(name)),
        )
      }
      if (group.length > 1) {
        const features = intersectFeatures(group.map(extractFeatures))
        return {
          features: features.length
            ? features
            : [{ kind: 'tag', value: seed.tagName.toLowerCase() }],
          scope: parent,
        }
      }
    }

    let ancestor: HTMLElement | null = parent
    let depth = 0
    while (ancestor && depth < 5) {
      const matches = queryByFeatures(seedFeatures, ancestor)
      if (matches.length > 1) {
        const common = intersectFeatures(matches.map(extractFeatures))
        return {
          features: common.length ? common : seedFeatures,
          scope: ancestor,
        }
      }
      ancestor = ancestor.parentElement
      depth++
    }
  }

  return { features: seedFeatures, scope: seed.ownerDocument }
}

export function refineFeatures(
  positives: HTMLElement[],
  negatives: HTMLElement[],
): { features: ElementFeature[]; notFeatures: ElementFeature[] } {
  if (!positives.length) {
    return { features: [], notFeatures: [] }
  }

  const common = intersectFeatures(positives.map(extractFeatures))
  const distinguishing = common.filter((feature) =>
    negatives.every((el) => !hasFeature(el, feature)),
  )

  let features = common
  if (
    distinguishing.length &&
    positives.every((el) => matchesFeatures(el, distinguishing))
  ) {
    const tag = common.find((feature) => feature.kind === 'tag')
    const next = uniqueFeatures([...(tag ? [tag] : []), ...distinguishing])
    if (positives.every((el) => matchesFeatures(el, next))) {
      features = next
    }
  }

  const notFeatures: ElementFeature[] = []
  for (const extra of negatives) {
    if (!matchesFeatures(extra, features)) continue
    for (const feature of extractFeatures(extra)) {
      if (feature.kind !== 'class') continue
      if (positives.every((el) => !hasFeature(el, feature))) {
        notFeatures.push(feature)
      }
    }
  }

  return {
    features: features.length ? features : common,
    notFeatures: uniqueFeatures(notFeatures),
  }
}

export function matchesNotFeatures(
  el: HTMLElement,
  notFeatures: ElementFeature[],
): boolean {
  return notFeatures.some((feature) => hasFeature(el, feature))
}

export function buildCssSelector(
  features: ElementFeature[],
  notFeatures: ElementFeature[],
  scope: ParentNode,
): string {
  const self = featuresToSelector(features)
  if (!self) return ''

  const nots = notFeatures
    .filter((feature) => feature.kind === 'class')
    .map((feature) => `:not(.${CSS.escape(feature.value)})`)
    .join('')

  if (scope instanceof HTMLElement) {
    const parent = featuresToSelector(
      extractFeatures(scope).filter(
        (feature) => feature.kind === 'tag' || feature.kind === 'class',
      ),
    )
    if (parent) return `${parent} > ${self}${nots}`
  }

  return `${self}${nots}`
}
