import { orgTreeSchema, type OrgNode } from '../model/orgNode.ts'
import { validateOrgTree } from '../model/validateOrgTree.ts'

export async function fetchOrgTree(
    signal: AbortSignal,
): Promise<readonly OrgNode[]> {
    const response = await fetch('/api/org-tree', { signal })

    if (!response.ok) {
        throw new Error(`Organization tree request failed with ${response.status}`)
    }

    const payload: unknown = await response.json()
    const nodes = orgTreeSchema.parse(payload)

    return validateOrgTree(nodes)
}
