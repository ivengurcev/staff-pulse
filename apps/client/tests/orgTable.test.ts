import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
    buildOrgTableRows,
    filterOrgTableRows,
    sortOrgTableRows,
    type OrgTableRow,
} from '../src/features/org-tree/model/orgTable.ts'
import type { OrgAggregate } from '../src/features/org-tree/model/buildOrgAggregates.ts'
import type { OrgNode } from '../src/features/org-tree/model/orgNode.ts'

const timestamp = '2026-09-01T00:00:00.000Z'

function node(id: string, name: string): OrgNode {
    return {
        id,
        name,
        parentId: null,
        headcount: 10,
        budget: 1_000_000,
        performance: 75,
        updatedAt: timestamp,
    }
}

function aggregate(
    nodeId: string,
    level: number,
    totalHeadcount: number,
    totalBudget: number,
    averagePerformance: number | null,
): OrgAggregate {
    return { nodeId, level, totalHeadcount, totalBudget, averagePerformance }
}

function row(nodeId: string, overrides: Partial<OrgTableRow> = {}): OrgTableRow {
    return {
        nodeId,
        name: nodeId,
        level: 0,
        totalHeadcount: 10,
        totalBudget: 1_000,
        averagePerformance: 50,
        ...overrides,
    }
}

describe('buildOrgTableRows', () => {
    it('builds rows in API order using aggregate values', () => {
        const nodes = [node('a', 'Alpha'), node('b', 'Beta')]
        const aggregates = new Map<string, OrgAggregate>([
            ['b', aggregate('b', 1, 20, 2_000, 55)],
            ['a', aggregate('a', 0, 30, 3_000, 60)],
        ])

        assert.deepEqual(buildOrgTableRows(nodes, aggregates), [
            {
                nodeId: 'a',
                name: 'Alpha',
                level: 0,
                totalHeadcount: 30,
                totalBudget: 3_000,
                averagePerformance: 60,
            },
            {
                nodeId: 'b',
                name: 'Beta',
                level: 1,
                totalHeadcount: 20,
                totalBudget: 2_000,
                averagePerformance: 55,
            },
        ])
    })

    it('throws when an aggregate is missing for a node', () => {
        assert.throws(() => buildOrgTableRows([node('a', 'Alpha')], new Map()))
    })
})

describe('filterOrgTableRows', () => {
    const rows = [
        row('a', { name: 'Engineering' }),
        row('b', { name: 'Operations' }),
        row('c', { name: 'Product Engineering' }),
    ]

    it('matches a trimmed case-insensitive substring', () => {
        assert.deepEqual(filterOrgTableRows(rows, '  eng '), [rows[0], rows[2]])
    })

    it('returns all rows for an empty or whitespace filter', () => {
        assert.equal(filterOrgTableRows(rows, ''), rows)
        assert.equal(filterOrgTableRows(rows, '   '), rows)
    })
})

describe('sortOrgTableRows', () => {
    it('returns the same array reference when sort is null', () => {
        const rows = [row('a'), row('b')]

        assert.equal(sortOrgTableRows(rows, null), rows)
    })

    it('sorts a numeric column ascending and descending', () => {
        const rows = [
            row('a', { totalHeadcount: 30 }),
            row('b', { totalHeadcount: 10 }),
            row('c', { totalHeadcount: 20 }),
        ]

        const asc = sortOrgTableRows(rows, { column: 'totalHeadcount', direction: 'asc' })
        assert.deepEqual(asc.map((r) => r.nodeId), ['b', 'c', 'a'])

        const desc = sortOrgTableRows(rows, { column: 'totalHeadcount', direction: 'desc' })
        assert.deepEqual(desc.map((r) => r.nodeId), ['a', 'c', 'b'])
    })

    it('sorts the name column via localeCompare', () => {
        const rows = [
            row('b', { name: 'Beta' }),
            row('a', { name: 'Alpha' }),
            row('c', { name: 'Charlie' }),
        ]

        const sorted = sortOrgTableRows(rows, { column: 'name', direction: 'asc' })
        assert.deepEqual(sorted.map((r) => r.nodeId), ['a', 'b', 'c'])
    })

    it('keeps null averagePerformance at the bottom in both directions', () => {
        const rows = [
            row('x', { averagePerformance: null }),
            row('high', { averagePerformance: 90 }),
            row('low', { averagePerformance: 30 }),
            row('y', { averagePerformance: null }),
        ]

        const asc = sortOrgTableRows(rows, { column: 'averagePerformance', direction: 'asc' })
        assert.deepEqual(asc.map((r) => r.nodeId), ['low', 'high', 'x', 'y'])

        const desc = sortOrgTableRows(rows, { column: 'averagePerformance', direction: 'desc' })
        assert.deepEqual(desc.map((r) => r.nodeId), ['high', 'low', 'x', 'y'])
    })
})
