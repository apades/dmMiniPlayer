import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createLongplayBridge } from './index'

const scope = {
  projectId: '11111111-1111-4111-8111-111111111111',
  environment: 'sandbox' as const,
}
const featureId = '22222222-2222-4222-8222-222222222222'
const session = {
  customerId: '33333333-3333-4333-8333-333333333333',
  sessionId: '44444444-4444-4444-8444-444444444444',
  accessToken: `gg_ct_${'a'.repeat(43)}`,
  refreshToken: `gg_rt_${'b'.repeat(43)}`,
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  refreshExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
}

function response(allowed: boolean, kind = 'access', environment = 'sandbox') {
  return Response.json(
    {
      requestId: '55555555-5555-4555-8555-555555555555',
      scope: { ...scope, environment },
      check: {
        internal_feature_id: featureId,
        name: 'VIP capability',
        kind,
        quantity: '1',
        allowed,
        reason: allowed ? null : 'not_entitled',
        preview: null,
      },
    },
    { headers: { 'X-Indiana-Protocol': '0.10' } },
  )
}

test('does nothing on import/construction and refuses an unauthenticated request', async () => {
  let requests = 0
  const bridge = createLongplayBridge({
    baseUrl: 'https://longplay.test',
    scope,
    fetch: async () => {
      requests++
      return response(true)
    },
    onPurchaseRequired: () => assert.fail('Unauthenticated purchase prompt'),
  })
  try {
    assert.equal(requests, 0)
    await assert.rejects(
      bridge.request(featureId, () => assert.fail('Triggered')),
    )
    assert.equal(requests, 0)
  } finally {
    bridge.destroy()
  }
})

test('checks with the Customer credential and retries after purchase without caching access', async () => {
  let allowed = false
  let requests = 0
  let prompts = 0
  let triggers = 0
  const bridge = createLongplayBridge({
    baseUrl: 'https://longplay.test',
    scope,
    fetch: async (url, init) => {
      requests++
      assert.equal(
        String(url),
        'https://longplay.test/api/v1/entitlements/check',
      )
      assert.equal(
        new Headers(init?.headers).get('Authorization'),
        `Bearer ${session.accessToken}`,
      )
      assert.deepEqual(JSON.parse(String(init?.body)), {
        requirement: {
          internal_feature_id: featureId,
          quantity: '1',
          properties: {},
        },
      })
      return response(allowed)
    },
    onPurchaseRequired: (id, check) => {
      assert.equal(id, featureId)
      assert.equal(check.allowed, false)
      prompts++
      allowed = true // Even an immediate successful purchase needs a NEW check.
    },
  })
  const trigger = () => ++triggers
  try {
    bridge.identify(session)
    assert.equal((await bridge.request(featureId, trigger)).allowed, false)
    assert.equal(triggers, 0)
    assert.deepEqual(await bridge.request(featureId, trigger), {
      allowed: true,
      value: 1,
    })
    allowed = false // Revoked/expired VIP access must not retain a cached grant.
    assert.equal((await bridge.request(featureId, trigger)).allowed, false)
    assert.equal(triggers, 1)
    assert.equal(prompts, 2)
    assert.equal(requests, 3)
  } finally {
    bridge.destroy()
  }
})

test('errors and foreign-environment replies never trigger a feature or a purchase prompt', async () => {
  for (const fetcher of [
    async () => {
      throw new Error('Offline')
    },
    async () => response(true, 'access', 'live'),
    async () => response(true, 'metered'),
  ]) {
    const bridge = createLongplayBridge({
      baseUrl: 'https://longplay.test',
      scope,
      fetch: fetcher,
      onPurchaseRequired: () => assert.fail('Unexpected purchase prompt'),
    })
    try {
      bridge.identify(session)
      await assert.rejects(
        bridge.request(featureId, () => assert.fail('Triggered')),
      )
    } finally {
      bridge.destroy()
    }
  }
})

test('logout and account switches fence an in-flight access decision', async () => {
  for (const change of ['reset', 'identify', 'destroy'] as const) {
    let respond!: (value: Response) => void
    let requested!: () => void
    const started = new Promise<void>((resolve) => {
      requested = resolve
    })
    const bridge = createLongplayBridge({
      baseUrl: 'https://longplay.test',
      scope,
      fetch: () => {
        requested()
        return new Promise((resolve) => {
          respond = resolve
        })
      },
      onPurchaseRequired: () => assert.fail('Stale purchase prompt'),
    })
    try {
      bridge.identify(session)
      const pending = bridge.request(featureId, () =>
        assert.fail('Stale feature trigger'),
      )
      const rejected = assert.rejects(pending)
      await started
      if (change === 'identify')
        bridge.identify({ ...session, accessToken: `gg_ct_${'c'.repeat(43)}` })
      else bridge[change]()
      respond(response(true))
      await rejected
    } finally {
      bridge.destroy()
    }
  }
})
