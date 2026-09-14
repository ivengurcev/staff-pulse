import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parseOrgEvent } from '../src/features/org-tree/model/orgEvents.ts'

const validNode = {
    id: 'division-1',
    name: 'Engineering',
    parentId: null,
    headcount: 10,
    budget: 1_000_000,
    performance: 75,
    updatedAt: '2026-09-01T00:00:00.000Z',
}

describe('parseOrgEvent', () => {
    it('accepts a valid node.updated event', () => {
        const event = parseOrgEvent({ type: 'node.updated', node: validNode })

        assert.equal(event.type, 'node.updated')
        assert.deepEqual(event.node, validNode)
    })

    it('rejects an unknown event type', () => {
        assert.throws(() => parseOrgEvent({ type: 'node.deleted', node: validNode }))
    })

    it('rejects an invalid node payload', () => {
        assert.throws(() =>
            parseOrgEvent({
                type: 'node.updated',
                node: { ...validNode, performance: 101 },
            }),
        )
    })

    it('rejects a non-object payload', () => {
        assert.throws(() => parseOrgEvent('nope'))
    })
})
