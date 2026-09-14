import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildOrgTreeIndex } from '../src/features/org-tree/model/buildOrgTreeIndex.ts'
import { getAncestorIds } from '../src/features/org-tree/model/getAncestorIds.ts'
import type { OrgNode } from '../src/features/org-tree/model/orgNode.ts'

const timestamp = '2026-09-01T00:00:00.000Z'

function node(id: string, parentId: string | null): OrgNode {
    return {
        id,
        name: id,
        parentId,
        headcount: 10,
        budget: 1_000_000,
        performance: 75,
        updatedAt: timestamp,
    }
}

describe('getAncestorIds', () => {
    it('returns ancestors from nearest parent up to the root', () => {
        const nodes = [
            node('division', null),
            node('department', 'division'),
            node('team', 'department'),
        ]
        const index = buildOrgTreeIndex(nodes)

        assert.deepEqual(getAncestorIds('team', index), ['department', 'division'])
    })

    it('returns an empty array for a root node', () => {
        const index = buildOrgTreeIndex([node('root', null)])

        assert.deepEqual(getAncestorIds('root', index), [])
    })

    it('returns an empty array for an unknown node id', () => {
        const index = buildOrgTreeIndex([node('root', null)])

        assert.deepEqual(getAncestorIds('missing', index), [])
    })
})
