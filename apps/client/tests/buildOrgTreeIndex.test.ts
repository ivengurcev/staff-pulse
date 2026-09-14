import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildOrgTreeIndex } from '../src/features/org-tree/model/buildOrgTreeIndex.ts'
import { getInitialExpandedNodeIds } from '../src/features/org-tree/model/getInitialExpandedNodeIds.ts'
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

describe('buildOrgTreeIndex', () => {
    it('indexes an unsorted flat tree while preserving API order', () => {
        const team = node('team', 'department-a')
        const departmentB = node('department-b', 'root')
        const root = node('root', null)
        const departmentA = node('department-a', 'root')

        const index = buildOrgTreeIndex([team, departmentB, root, departmentA])

        assert.equal(index.nodesById.get('team'), team)
        assert.deepEqual(index.rootIds, ['root'])
        assert.deepEqual(index.childrenByParentId.get('root'), [
            'department-b',
            'department-a',
        ])
        assert.deepEqual(index.childrenByParentId.get('department-a'), ['team'])
        assert.equal(index.childrenByParentId.has('team'), false)
    })
})

describe('getInitialExpandedNodeIds', () => {
    it('expands only root nodes', () => {
        const index = buildOrgTreeIndex([
            node('root-a', null),
            node('department', 'root-a'),
            node('root-b', null),
        ])

        assert.deepEqual([...getInitialExpandedNodeIds(index)], ['root-a', 'root-b'])
    })
})
