import type { OrgNode } from './orgNode.ts'

export class OrgTreeValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'OrgTreeValidationError'
    }
}

export function validateOrgTree(nodes: readonly OrgNode[]): readonly OrgNode[] {
    const nodesById = new Map<string, OrgNode>()

    for (const node of nodes) {
        if (nodesById.has(node.id)) {
            throw new OrgTreeValidationError(`Duplicate node id: ${node.id}`)
        }

        nodesById.set(node.id, node)
    }

    for (const node of nodes) {
        if (node.parentId === null) {
            continue
        }

        if (node.parentId === node.id) {
            throw new OrgTreeValidationError(`Node cannot be its own parent: ${node.id}`)
        }

        if (!nodesById.has(node.parentId)) {
            throw new OrgTreeValidationError(
                `Parent ${node.parentId} does not exist for node ${node.id}`,
            )
        }
    }

    const visitState = new Map<string, 'visiting' | 'visited'>()

    const visit = (nodeId: string): void => {
        const state = visitState.get(nodeId)

        if (state === 'visited') {
            return
        }

        if (state === 'visiting') {
            throw new OrgTreeValidationError(`Cycle detected at node: ${nodeId}`)
        }

        visitState.set(nodeId, 'visiting')

        const parentId = nodesById.get(nodeId)?.parentId
        if (parentId !== null && parentId !== undefined) {
            visit(parentId)
        }

        visitState.set(nodeId, 'visited')
    }

    for (const node of nodes) {
        visit(node.id)
    }

    return nodes
}
