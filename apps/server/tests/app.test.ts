import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createApp, createSseHub } from '#server/app'
import { createOrgStore } from '#server/state/orgStore'
import { createUpdateLoop } from '#server/state/updateLoop'
import type { OrgNode } from '#server/domain/orgNode'

type ApiOrgNode = {
    id: string
    name: string
    parentId: string | null
    headcount: number
    budget: number
    performance: number
    updatedAt: string
}

function makeNode(id: string, overrides: Partial<OrgNode> = {}): OrgNode {
    return {
        id,
        name: id,
        parentId: null,
        headcount: 10,
        budget: 1_000_000,
        performance: 50,
        updatedAt: '2026-09-01T00:00:00.000Z',
        ...overrides,
    }
}

describe('Staff Pulse API', () => {
    it('keeps the health endpoint available', async () => {
        const { app } = createApp(createOrgStore())

        const response = await app.request('/health')

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { status: 'ok' })
    })

    it('returns the deterministic three-level organization tree from the store', async () => {
        const { app } = createApp(createOrgStore())
        const response = await app.request('/api/org-tree')
        const nodes = (await response.json()) as ApiOrgNode[]

        assert.equal(response.status, 200)
        assert.equal(nodes.length, 51)

        const ids = new Set(nodes.map(({ id }) => id))
        const rootIds = new Set(
            nodes.filter(({ parentId }) => parentId === null).map(({ id }) => id),
        )
        const departments = nodes.filter(
            ({ parentId }) => parentId !== null && rootIds.has(parentId),
        )
        const departmentIds = new Set(departments.map(({ id }) => id))
        const teams = nodes.filter(
            ({ parentId }) => parentId !== null && departmentIds.has(parentId),
        )

        assert.equal(ids.size, 51)
        assert.equal(rootIds.size, 3)
        assert.equal(departments.length, 12)
        assert.equal(teams.length, 36)
        assert.ok(
            nodes.every(({ parentId }) => parentId === null || ids.has(parentId)),
        )
        assert.ok(teams.every(({ id }) => !nodes.some(({ parentId }) => parentId === id)))
    })

    it('serves the current store state in REST after an update', async () => {
        const store = createOrgStore([makeNode('a')])
        const { app } = createApp(store)

        store.replaceNode({ ...makeNode('a'), headcount: 42 })

        const response = await app.request('/api/org-tree')
        const nodes = (await response.json()) as ApiOrgNode[]

        assert.equal(nodes[0]?.headcount, 42)
    })
})

describe('SSE endpoint', () => {
    it('serves events with text/event-stream content type', async () => {
        const { app } = createApp(createOrgStore())

        const response = await app.request('/api/org-tree/events')

        assert.equal(response.status, 200)
        assert.ok(response.headers.get('content-type')?.includes('text/event-stream'))
    })
})

describe('SSE hub', () => {
    it('broadcasts the same event object to all subscribers', () => {
        const hub = createSseHub()
        const first: unknown[] = []
        const second: unknown[] = []

        hub.subscribe((event) => first.push(event))
        hub.subscribe((event) => second.push(event))

        const event = { type: 'node.updated' as const, node: makeNode('a') }
        hub.broadcast(event)

        assert.equal(first.length, 1)
        assert.equal(second.length, 1)
        assert.equal(first[0], event)
        assert.equal(second[0], event)
    })

    it('removes a subscriber when its unsubscribe is called', () => {
        const hub = createSseHub()
        const received: unknown[] = []

        const unsubscribe = hub.subscribe((event) => received.push(event))
        unsubscribe()

        hub.broadcast({ type: 'node.updated', node: makeNode('a') })

        assert.equal(received.length, 0)
    })
})

describe('realtime wiring', () => {
    it('delivers node.updated with the full node via the update loop', () => {
        const store = createOrgStore([makeNode('a')])
        const { hub } = createApp(store)
        const events: unknown[] = []

        hub.subscribe((event) => events.push(event))

        const loop = createUpdateLoop(store, {
            onUpdate: (node) => hub.broadcast({ type: 'node.updated', node }),
        })
        loop.tick()

        assert.equal(events.length, 1)

        const event = events[0] as { type: string; node: OrgNode }
        assert.equal(event.type, 'node.updated')
        assert.equal(event.node.id, 'a')
        assert.equal(event.node.headcount, 11)
        assert.deepEqual(event.node, store.getNodes()[0])
    })
})
