import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createOrgStore } from '#server/state/orgStore'
import { createUpdateLoop } from '#server/state/updateLoop'
import type { OrgNode } from '#server/domain/orgNode'

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

function makeClock(): () => Date {
    let value = Date.UTC(2026, 0, 1, 0, 0, 0)
    return () => {
        value += 3_000
        return new Date(value)
    }
}

function changedIndex(
    before: readonly OrgNode[],
    after: readonly OrgNode[],
): number {
    const changed = before
        .map((node, index) => (node.updatedAt !== after[index]?.updatedAt ? index : -1))
        .filter((index) => index !== -1)

    assert.equal(changed.length, 1)
    return changed[0] ?? -1
}

describe('orgStore', () => {
    it('exposes current nodes and replaces a node by id', () => {
        const store = createOrgStore([makeNode('a'), makeNode('b')])

        assert.equal(store.getNodes().length, 2)

        const updated = { ...makeNode('a'), headcount: 42 }
        store.replaceNode(updated)

        assert.equal(store.getNodes()[0]?.headcount, 42)
        assert.equal(store.getNodes()[1]?.id, 'b')
    })

    it('throws when replacing an unknown node id', () => {
        const store = createOrgStore([makeNode('a')])

        assert.throws(() => store.replaceNode(makeNode('missing')))
    })
})

describe('updateLoop', () => {
    it('updates exactly one node per tick, round-robin', () => {
        const store = createOrgStore([makeNode('a'), makeNode('b'), makeNode('c')])
        const loop = createUpdateLoop(store, { now: makeClock() })

        const beforeFirst = store.getNodes()
        loop.tick()
        assert.equal(changedIndex(beforeFirst, store.getNodes()), 0)

        const beforeSecond = store.getNodes()
        loop.tick()
        assert.equal(changedIndex(beforeSecond, store.getNodes()), 1)

        const beforeThird = store.getNodes()
        loop.tick()
        assert.equal(changedIndex(beforeThird, store.getNodes()), 2)

        const beforeWrap = store.getNodes()
        loop.tick()
        assert.equal(changedIndex(beforeWrap, store.getNodes()), 0)
    })

    it('cycles metrics headcount → budget → performance', () => {
        const store = createOrgStore([makeNode('a')])
        const loop = createUpdateLoop(store, { now: makeClock() })

        loop.tick()
        assert.equal(store.getNodes()[0]?.headcount, 11)
        assert.equal(store.getNodes()[0]?.budget, 1_000_000)
        assert.equal(store.getNodes()[0]?.performance, 50)

        loop.tick()
        assert.equal(store.getNodes()[0]?.headcount, 11)
        assert.equal(store.getNodes()[0]?.budget, 1_125_000)
        assert.equal(store.getNodes()[0]?.performance, 50)

        loop.tick()
        assert.equal(store.getNodes()[0]?.headcount, 11)
        assert.equal(store.getNodes()[0]?.budget, 1_125_000)
        assert.equal(store.getNodes()[0]?.performance, 51)

        loop.tick()
        assert.equal(store.getNodes()[0]?.headcount, 12)
        assert.equal(store.getNodes()[0]?.budget, 1_125_000)
        assert.equal(store.getNodes()[0]?.performance, 51)
    })

    it('returns the updated node from tick', () => {
        const store = createOrgStore([makeNode('a')])
        const loop = createUpdateLoop(store, { now: makeClock() })

        const updated = loop.tick()

        assert.ok(updated)
        assert.equal(updated?.id, 'a')
        assert.equal(updated?.headcount, 11)
        assert.equal(store.getNodes()[0], updated)
    })

    it('calls onUpdate once per tick with the updated node', () => {
        const store = createOrgStore([makeNode('a')])
        const calls: OrgNode[] = []
        const loop = createUpdateLoop(store, {
            now: makeClock(),
            onUpdate: (node) => calls.push(node),
        })

        const updated = loop.tick()

        assert.equal(calls.length, 1)
        assert.equal(calls[0], updated)
    })

    it('never changes id, name or parentId', () => {
        const store = createOrgStore([
            makeNode('division-1', { name: 'Engineering', parentId: null }),
            makeNode('team-x', { name: 'Team X', parentId: 'division-1' }),
        ])
        const loop = createUpdateLoop(store, { now: makeClock() })

        for (let i = 0; i < 10; i += 1) {
            loop.tick()
        }

        const [division, team] = store.getNodes()
        assert.equal(division?.id, 'division-1')
        assert.equal(division?.name, 'Engineering')
        assert.equal(division?.parentId, null)
        assert.equal(team?.id, 'team-x')
        assert.equal(team?.name, 'Team X')
        assert.equal(team?.parentId, 'division-1')
    })

    it('always updates updatedAt to a newer valid ISO datetime', () => {
        const store = createOrgStore([makeNode('a')])
        const loop = createUpdateLoop(store, { now: makeClock() })

        const timestamps: string[] = []
        for (let i = 0; i < 5; i += 1) {
            loop.tick()
            timestamps.push(store.getNodes()[0]?.updatedAt ?? '')
        }

        for (const timestamp of timestamps) {
            assert.equal(Number.isNaN(Date.parse(timestamp)), false)
        }
        assert.equal(new Set(timestamps).size, timestamps.length)

        for (let i = 1; i < timestamps.length; i += 1) {
            assert.ok(
                Date.parse(timestamps[i] ?? '') > Date.parse(timestamps[i - 1] ?? ''),
            )
        }
    })

    it('keeps values valid per schema across many ticks', () => {
        const store = createOrgStore([
            makeNode('a', { headcount: 99, budget: 9_999_999, performance: 100 }),
            makeNode('b', { headcount: 0, budget: 0, performance: 0 }),
        ])
        const loop = createUpdateLoop(store, { now: makeClock() })

        for (let i = 0; i < 300; i += 1) {
            loop.tick()
        }

        for (const node of store.getNodes()) {
            assert.ok(Number.isInteger(node.headcount) && node.headcount >= 0)
            assert.ok(Number.isFinite(node.budget) && node.budget >= 0)
            assert.ok(node.performance >= 0 && node.performance <= 100)
            assert.equal(Number.isNaN(Date.parse(node.updatedAt)), false)
        }
    })
})
