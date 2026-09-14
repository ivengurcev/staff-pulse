import { buildOrgAggregates, type OrgAggregate } from './buildOrgAggregates.ts'
import { buildOrgTreeIndex, type OrgTreeIndex } from './buildOrgTreeIndex.ts'
import type { OrgNode } from './orgNode.ts'

export type OrgSnapshot = {
    nodes: readonly OrgNode[]
    index: OrgTreeIndex
    aggregates: ReadonlyMap<string, OrgAggregate>
}

export function createOrgSnapshot(nodes: readonly OrgNode[]): OrgSnapshot {
    const index = buildOrgTreeIndex(nodes)
    const aggregates = buildOrgAggregates(nodes, index)
    return { nodes, index, aggregates }
}

export function mergeOrgNodes(
    current: readonly OrgNode[],
    fetched: readonly OrgNode[],
): readonly OrgNode[] {
    const currentById = new Map<string, OrgNode>()
    for (const node of current) {
        currentById.set(node.id, node)
    }

    const fetchedById = new Map<string, OrgNode>()
    for (const node of fetched) {
        fetchedById.set(node.id, node)
    }

    if (currentById.size !== fetchedById.size) {
        throw new Error(
            'Resync merge failed: current and fetched have different node sets',
        )
    }

    for (const [id, existing] of currentById) {
        const fetchedNode = fetchedById.get(id)
        if (!fetchedNode) {
            throw new Error(`Resync merge failed: node ${id} is missing in fetched`)
        }
        if (
            existing.name !== fetchedNode.name ||
            existing.parentId !== fetchedNode.parentId
        ) {
            throw new Error(`Resync merge failed: topology changed for node ${id}`)
        }
    }

    return fetched.map((node) => {
        const existing = currentById.get(node.id)
        if (existing && existing.updatedAt >= node.updatedAt) {
            return existing
        }
        return node
    })
}
