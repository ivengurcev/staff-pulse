import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildOrgTreeIndex } from '../src/features/org-tree/model/buildOrgTreeIndex.ts'
import { buildOrgAggregates } from '../src/features/org-tree/model/buildOrgAggregates.ts'
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

describe('buildOrgAggregates', () => {
    it('computes a leaf aggregate from the node itself', () => {
        const nodes = [node('leaf', null, { headcount: 4, budget: 250, performance: 60 })]
        const index = buildOrgTreeIndex(nodes)
        const aggregates = buildOrgAggregates(nodes, index)

        assert.deepEqual(aggregates.get('leaf'), {
            nodeId: 'leaf',
            level: 0,
            totalHeadcount: 4,
            totalBudget: 250,
            averagePerformance: 60,
        })
    })

    it('sums headcount and budget across descendants and assigns levels', () => {
        const nodes = [
            node('division', null, { headcount: 10, budget: 100, performance: 90 }),
            node('department', 'division', { headcount: 10, budget: 200, performance: 30 }),
            node('team', 'department', { headcount: 20, budget: 300, performance: 60 }),
        ]
        const index = buildOrgTreeIndex(nodes)
        const aggregates = buildOrgAggregates(nodes, index)

        assert.deepEqual(aggregates.get('team'), {
            nodeId: 'team',
            level: 2,
            totalHeadcount: 20,
            totalBudget: 300,
            averagePerformance: 60,
        })
        assert.deepEqual(aggregates.get('department'), {
            nodeId: 'department',
            level: 1,
            totalHeadcount: 30,
            totalBudget: 500,
            averagePerformance: 50,
        })
        assert.deepEqual(aggregates.get('division'), {
            nodeId: 'division',
            level: 0,
            totalHeadcount: 40,
            totalBudget: 600,
            averagePerformance: 60,
        })
    })

    it('computes weighted average performance by headcount', () => {
        const nodes = [
            node('root', null, { headcount: 10, performance: 90 }),
            node('small', 'root', { headcount: 10, performance: 10 }),
            node('large', 'root', { headcount: 30, performance: 50 }),
        ]
        const index = buildOrgTreeIndex(nodes)
        const aggregates = buildOrgAggregates(nodes, index)

        assert.equal(aggregates.get('root')?.totalHeadcount, 50)
        assert.equal(aggregates.get('root')?.averagePerformance, 50)
    })

    it('returns null averagePerformance when total headcount is zero', () => {
        const nodes = [node('empty', null, { headcount: 0, performance: 50 })]
        const index = buildOrgTreeIndex(nodes)
        const aggregates = buildOrgAggregates(nodes, index)

        assert.equal(aggregates.get('empty')?.totalHeadcount, 0)
        assert.equal(aggregates.get('empty')?.averagePerformance, null)
    })

    it('aggregates each root independently', () => {
        const nodes = [
            node('root-a', null, { headcount: 5 }),
            node('child-a', 'root-a', { headcount: 5 }),
            node('root-b', null, { headcount: 7 }),
        ]
        const index = buildOrgTreeIndex(nodes)
        const aggregates = buildOrgAggregates(nodes, index)

        assert.equal(aggregates.size, 3)
        assert.equal(aggregates.get('root-a')?.totalHeadcount, 10)
        assert.equal(aggregates.get('root-b')?.totalHeadcount, 7)
    })
})
