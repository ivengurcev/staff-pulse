import type { OrgTreeIndex } from './buildOrgTreeIndex.ts'

export function getInitialExpandedNodeIds(
    index: OrgTreeIndex,
): ReadonlySet<string> {
    return new Set(index.rootIds)
}
