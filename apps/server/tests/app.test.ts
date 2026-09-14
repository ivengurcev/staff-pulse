import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { app } from '#server/app'

type ApiOrgNode = {
    id: string
    name: string
    parentId: string | null
    headcount: number
    budget: number
    performance: number
    updatedAt: string
}

describe('Staff Pulse API', () => {
    it('keeps the health endpoint available', async () => {
        const response = await app.request('/health')

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { status: 'ok' })
    })

    it('returns the deterministic three-level organization tree', async () => {
        const response = await app.request('/api/org-tree')
        const nodes = (await response.json()) as ApiOrgNode[]

        assert.equal(response.status, 200)
        assert.equal(nodes.length, 51)

        const ids = new Set(nodes.map(({ id }) => id))
        const rootIds = new Set(
            nodes.filter(({ parentId }) => parentId === null).map(({ id }) => id),
        )
        const departments = nodes.filter(
            ({ parentId }) => parentId !== null && rootIds.has(parentId),
        )
        const departmentIds = new Set(departments.map(({ id }) => id))
        const teams = nodes.filter(
            ({ parentId }) => parentId !== null && departmentIds.has(parentId),
        )

        assert.equal(ids.size, 51)
        assert.equal(rootIds.size, 3)
        assert.equal(departments.length, 12)
        assert.equal(teams.length, 36)
        assert.ok(
            nodes.every(
                ({ parentId }) => parentId === null || ids.has(parentId),
            ),
        )
        assert.ok(teams.every(({ id }) => !nodes.some(({ parentId }) => parentId === id)))
    })
})
