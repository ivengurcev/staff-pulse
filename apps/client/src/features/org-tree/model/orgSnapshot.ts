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

    return fetched.map((node) => {
        const existing = currentById.get(node.id)
        if (existing && existing.updatedAt > node.updatedAt) {
            return existing
        }
        return node
    })
}
