import type { OrgNode } from '#server/domain/orgNode'
import { orgTree } from '#server/data/orgTree'

export type OrgStore = {
    getNodes(): readonly OrgNode[]
    replaceNode(node: OrgNode): void
}

export function createOrgStore(initial: readonly OrgNode[] = orgTree): OrgStore {
    let nodes: readonly OrgNode[] = initial

    return {
        getNodes: () => nodes,
        replaceNode(node) {
            const index = nodes.findIndex((candidate) => candidate.id === node.id)
            if (index === -1) {
                throw new Error(`Unknown node id: ${node.id}`)
            }

            const next = [...nodes]
            next[index] = node
            nodes = next
        },
    }
}
