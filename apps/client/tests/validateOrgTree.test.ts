import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { orgTreeSchema, type OrgNode } from '../src/features/org-tree/model/orgNode.ts'
import { OrgTreeValidationError, validateOrgTree } from '../src/features/org-tree/model/validateOrgTree.ts'

const timestamp = '2026-09-01T00:00:00.000Z'

function node(
    id: string,
    parentId: string | null = null,
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

describe('orgTreeSchema', () => {
    it('accepts an empty response', () => {
        assert.deepEqual(orgTreeSchema.parse([]), [])
    })

    it('rejects invalid field values', () => {
        const invalidNodes = [
            node('negative-headcount', null, { headcount: -1 }),
            node('negative-budget', null, { budget: -1 }),
            node('low-performance', null, { performance: -1 }),
            node('high-performance', null, { performance: 101 }),
            node('invalid-date', null, { updatedAt: 'yesterday' }),
        ]

        for (const invalidNode of invalidNodes) {
            assert.throws(() => orgTreeSchema.parse([invalidNode]))
        }
    })
})

describe('validateOrgTree', () => {
    it('returns a valid hierarchy unchanged', () => {
        const nodes = [node('root'), node('department', 'root'), node('team', 'department')]

        assert.equal(validateOrgTree(nodes), nodes)
    })

    it('rejects duplicate ids', () => {
        assert.throws(
            () => validateOrgTree([node('duplicate'), node('duplicate')]),
            OrgTreeValidationError,
        )
    })

    it('rejects a missing parent', () => {
        assert.throws(
            () => validateOrgTree([node('orphan', 'missing')]),
            OrgTreeValidationError,
        )
    })

    it('rejects a self-parent', () => {
        assert.throws(
            () => validateOrgTree([node('self', 'self')]),
            OrgTreeValidationError,
        )
    })

    it('rejects a cycle', () => {
        assert.throws(
            () => validateOrgTree([node('first', 'second'), node('second', 'first')]),
            OrgTreeValidationError,
        )
    })
})
