import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { applyOrgNodePatch } from '../src/features/org-tree/model/applyOrgNodePatch.ts'
import { createOrgSnapshot } from '../src/features/org-tree/model/orgSnapshot.ts'
import type { OrgSnapshot } from '../src/features/org-tree/model/orgSnapshot.ts'
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

function makeSnapshot(): OrgSnapshot {
    return createOrgSnapshot([
        node('division', null, { headcount: 10, budget: 100, performance: 90 }),
        node('department-a', 'division', {
            headcount: 10,
            budget: 200,
            performance: 30,
        }),
        node('team-a', 'department-a', { headcount: 20, budget: 300, performance: 60 }),
        node('department-b', 'division', { headcount: 5, budget: 50, performance: 70 }),
        node('team-b', 'department-b', { headcount: 15, budget: 150, performance: 40 }),
    ])
}

function newer(node: OrgNode, overrides: Partial<OrgNode> = {}): OrgNode {
    return { ...node, updatedAt: '2026-09-01T00:00:05.000Z', ...overrides }
}

describe('applyOrgNodePatch', () => {
    it('applies a headcount delta to the node and its ancestors only', () => {
        const snapshot = makeSnapshot()
        const teamA = snapshot.index.nodesById.get('team-a')!

        const patched = applyOrgNodePatch(snapshot, newer(teamA, { headcount: 25 }))

        assert.equal(patched.aggregates.get('team-a')?.totalHeadcount, 25)
        assert.equal(patched.aggregates.get('department-a')?.totalHeadcount, 35)
        assert.equal(patched.aggregates.get('division')?.totalHeadcount, 65)
        assert.equal(patched.aggregates.get('department-b')?.totalHeadcount, 20)
        assert.equal(patched.aggregates.get('team-b')?.totalHeadcount, 15)
    })

    it('applies a budget delta to the node and its ancestors', () => {
        const snapshot = makeSnapshot()
        const teamA = snapshot.index.nodesById.get('team-a')!

        const patched = applyOrgNodePatch(snapshot, newer(teamA, { budget: 400 }))

        assert.equal(patched.aggregates.get('team-a')?.totalBudget, 400)
        assert.equal(patched.aggregates.get('department-a')?.totalBudget, 600)
        assert.equal(patched.aggregates.get('division')?.totalBudget, 900)
    })

    it('applies a weighted performance delta', () => {
        const snapshot = makeSnapshot()
        const teamA = snapshot.index.nodesById.get('team-a')!

        const patched = applyOrgNodePatch(snapshot, newer(teamA, { performance: 70 }))

        assert.equal(patched.aggregates.get('team-a')?.weightedPerformanceSum, 1400)
        assert.equal(
            patched.aggregates.get('department-a')?.weightedPerformanceSum,
            1700,
        )
        assert.equal(patched.aggregates.get('division')?.weightedPerformanceSum, 3550)
        assert.equal(patched.aggregates.get('team-a')?.averagePerformance, 70)
    })

    it('keeps untouched aggregates by reference', () => {
        const snapshot = makeSnapshot()
        const teamA = snapshot.index.nodesById.get('team-a')!

        const patched = applyOrgNodePatch(snapshot, newer(teamA, { headcount: 25 }))

        assert.equal(
            patched.aggregates.get('department-b'),
            snapshot.aggregates.get('department-b'),
        )
        assert.equal(
            patched.aggregates.get('team-b'),
            snapshot.aggregates.get('team-b'),
        )
    })

    it('updates index.nodesById and reuses topology maps', () => {
        const snapshot = makeSnapshot()
        const teamA = snapshot.index.nodesById.get('team-a')!
        const updatedTeamA = newer(teamA, { headcount: 25 })

        const patched = applyOrgNodePatch(snapshot, updatedTeamA)

        assert.equal(patched.index.nodesById.get('team-a'), updatedTeamA)
        assert.equal(
            patched.index.childrenByParentId,
            snapshot.index.childrenByParentId,
        )
        assert.equal(patched.index.rootIds, snapshot.index.rootIds)
    })

    it('ignores stale or duplicate updatedAt', () => {
        const snapshot = makeSnapshot()
        const teamA = snapshot.index.nodesById.get('team-a')!

        const stale = applyOrgNodePatch(snapshot, {
            ...teamA,
            updatedAt: '2026-08-31T23:59:59.000Z',
        })

        assert.equal(stale, snapshot)
    })

    it('ignores unknown node ids', () => {
        const snapshot = makeSnapshot()

        const patched = applyOrgNodePatch(snapshot, node('missing', null))

        assert.equal(patched, snapshot)
    })

    it('ignores topology changes', () => {
        const snapshot = makeSnapshot()
        const teamA = snapshot.index.nodesById.get('team-a')!

        const patched = applyOrgNodePatch(
            snapshot,
            newer(teamA, { parentId: 'department-b' }),
        )

        assert.equal(patched, snapshot)
    })
})
