import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import { fetchOrgTree } from '../src/features/org-tree/api/fetchOrgTree.ts'

const originalFetch = globalThis.fetch

const validNode = {
    id: 'root',
    name: 'Root',
    parentId: null,
    headcount: 10,
    budget: 1_000_000,
    performance: 75,
    updatedAt: '2026-09-01T00:00:00.000Z',
}

afterEach(() => {
    globalThis.fetch = originalFetch
})

describe('fetchOrgTree', () => {
    it('passes AbortSignal and returns fully validated data', async () => {
        const controller = new AbortController()
        let receivedSignal: AbortSignal | null | undefined

        globalThis.fetch = async (_input, init) => {
            receivedSignal = init?.signal
            return Response.json([validNode])
        }

        const nodes = await fetchOrgTree(controller.signal)

        assert.equal(receivedSignal, controller.signal)
        assert.deepEqual(nodes, [validNode])
    })

    it('rejects a non-success HTTP response', async () => {
        globalThis.fetch = async () => new Response(null, { status: 503 })

        await assert.rejects(fetchOrgTree(new AbortController().signal))
    })

    it('rejects a schema-invalid response', async () => {
        globalThis.fetch = async () => Response.json([{ ...validNode, performance: 101 }])

        await assert.rejects(fetchOrgTree(new AbortController().signal))
    })

    it('rejects a schema-valid cyclic hierarchy', async () => {
        globalThis.fetch = async () =>
            Response.json([
                { ...validNode, id: 'first', parentId: 'second' },
                { ...validNode, id: 'second', parentId: 'first' },
            ])

        await assert.rejects(fetchOrgTree(new AbortController().signal))
    })
})
