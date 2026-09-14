import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
    createOrgSnapshot,
    mergeOrgNodes,
} from '../src/features/org-tree/model/orgSnapshot.ts'
import type { OrgNode } from '../src/features/org-tree/model/orgNode.ts'

const timestamp = '2026-09-01T00:00:00.000Z'

function node(
    id: string,
    parentId: string | null,
    overrides: Partial<OrgNode> = {},
): OrgNode {
    return {
        id,
        name: id,
        parentId,
        headcount: 10,
        budget: 1_000_000,
        performance: 75,
        updatedAt: timestamp,
        ...overrides,
    }
}

describe('createOrgSnapshot', () => {
    it('builds index and aggregates for the given nodes', () => {
        const nodes = [
            node('division', null, { headcount: 10, budget: 100, performance: 90 }),
            node('department', 'division', {
                headcount: 10,
                budget: 200,
                performance: 30,
            }),
            node('team', 'department', { headcount: 20, budget: 300, performance: 60 }),
        ]
        const snapshot = createOrgSnapshot(nodes)

        assert.equal(snapshot.nodes, nodes)
        assert.deepEqual(snapshot.index.rootIds, ['division'])
        assert.equal(snapshot.index.nodesById.get('team'), nodes[2])
        assert.deepEqual(snapshot.index.childrenByParentId.get('department'), ['team'])

        assert.equal(snapshot.aggregates.get('division')?.totalHeadcount, 40)
        assert.equal(snapshot.aggregates.get('division')?.weightedPerformanceSum, 2400)
        assert.equal(snapshot.aggregates.get('division')?.averagePerformance, 60)
    })

    it('computes weighted average performance by headcount', () => {
        const nodes = [
            node('root', null, { headcount: 10, performance: 90 }),
            node('small', 'root', { headcount: 10, performance: 10 }),
            node('large', 'root', { headcount: 30, performance: 50 }),
        ]
        const snapshot = createOrgSnapshot(nodes)

        assert.equal(snapshot.aggregates.get('root')?.totalHeadcount, 50)
        assert.equal(snapshot.aggregates.get('root')?.averagePerformance, 50)
    })
})

describe('mergeOrgNodes', () => {
    it('keeps the newer version per id so resync does not roll back', () => {
        const current = [
            node('a', null, { headcount: 11, updatedAt: '2026-09-01T00:00:03.000Z' }),
            node('b', null, { headcount: 20, updatedAt: '2026-09-01T00:00:01.000Z' }),
        ]
        const fetched = [
            node('a', null, { headcount: 10, updatedAt: '2026-09-01T00:00:02.000Z' }),
            node('b', null, { headcount: 25, updatedAt: '2026-09-01T00:00:04.000Z' }),
        ]

        const merged = mergeOrgNodes(current, fetched)

        assert.equal(merged[0]?.headcount, 11)
        assert.equal(merged[1]?.headcount, 25)
    })

    it('preserves the fetched order', () => {
        const current = [node('a', null), node('b', null)]
        const fetched = [node('b', null), node('a', null)]

        const merged = mergeOrgNodes(current, fetched)

        assert.deepEqual(merged.map((n) => n.id), ['b', 'a'])
    })
})
