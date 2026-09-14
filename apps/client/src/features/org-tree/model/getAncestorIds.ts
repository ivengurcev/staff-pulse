import type { OrgTreeIndex } from './buildOrgTreeIndex.ts'

export function getAncestorIds(
    nodeId: string,
    index: OrgTreeIndex,
): readonly string[] {
    const ancestorIds: string[] = []
    let current = index.nodesById.get(nodeId)

    while (current && current.parentId !== null) {
        const parentId = current.parentId
        ancestorIds.push(parentId)
        current = index.nodesById.get(parentId)
    }

    return ancestorIds
}
