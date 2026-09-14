import type { OrgNode } from './orgNode.ts'

export type OrgTreeIndex = {
    nodesById: ReadonlyMap<string, OrgNode>
    childrenByParentId: ReadonlyMap<string, readonly string[]>
    rootIds: readonly string[]
}

export function buildOrgTreeIndex(nodes: readonly OrgNode[]): OrgTreeIndex {
    const nodesById = new Map<string, OrgNode>()
    const childrenByParentId = new Map<string, string[]>()
    const rootIds: string[] = []

    for (const node of nodes) {
        nodesById.set(node.id, node)

        if (node.parentId === null) {
            rootIds.push(node.id)
            continue
        }

        const childIds = childrenByParentId.get(node.parentId) ?? []
        childIds.push(node.id)
        childrenByParentId.set(node.parentId, childIds)
    }

    return {
        nodesById,
        childrenByParentId,
        rootIds,
    }
}
