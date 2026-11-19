import {
  createLongplay,
  type CustomerSession,
  type LongplayOptions,
} from '@tinkerlandai/longplay-sdk'

type Client = ReturnType<typeof createLongplay>
type AccessCheck = Awaited<ReturnType<Client['checkEntitlement']>>['check']

type Options = Pick<LongplayOptions, 'fetch' | 'timeoutMs'> & {
  baseUrl: string
  scope: NonNullable<LongplayOptions['scope']>
  onPurchaseRequired: (
    featureId: string,
    check: AccessCheck,
  ) => void | Promise<void>
}

/** Opt-in bridge for the commercial build's VIP access features (see #167). */
export function createLongplayBridge(options: Options) {
  const { onPurchaseRequired, ...connection } = options
  const client = createLongplay(connection)
  let identityRevision = 0

  return {
    // Only accept credentials issued by the product's authenticated backend.
    identify(session: CustomerSession) {
      identityRevision++
      client.identify(session)
    },
    reset() {
      identityRevision++
      client.reset()
    },
    destroy() {
      identityRevision++
      client.destroy()
    },
    async request<T>(
      featureId: string,
      trigger: () => T | Promise<T>,
    ): Promise<
      { allowed: true; value: T } | { allowed: false; check: AccessCheck }
    > {
      const revision = identityRevision
      const { check } = await client.checkEntitlement({
        requirement: {
          internal_feature_id: featureId,
          quantity: '1',
          properties: {},
        },
      })
      if (revision !== identityRevision) {
        throw new Error('Longplay identity changed during the access check')
      }
      if (check.kind !== 'access') {
        throw new Error('VIP bridge requires an access feature')
      }
      if (!check.allowed) {
        await onPurchaseRequired(featureId, check)
        // Opening or returning from a Paywall never grants access. Retry the
        // original request after purchase to obtain a fresh server decision.
        return { allowed: false, check }
      }
      return { allowed: true, value: await trigger() }
    },
  }
}
