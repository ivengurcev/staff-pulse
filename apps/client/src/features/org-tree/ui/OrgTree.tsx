import type { OrgTreeIndex } from '../model/buildOrgTreeIndex.ts'
import { OrgTreeNode } from './OrgTreeNode.tsx'
import { TreeList, TreeRegion } from './orgTree.styles.ts'

type OrgTreeProps = {
    index: OrgTreeIndex
    expandedNodeIds: ReadonlySet<string>
    selectedNodeId: string | null
    onToggle: (nodeId: string) => void
}

export function OrgTree({
    index,
    expandedNodeIds,
    selectedNodeId,
    onToggle,
}: OrgTreeProps) {
    return (
        <TreeRegion>
            <TreeList aria-label="Организационная структура">
                {index.rootIds.map((rootId) => (
                    <OrgTreeNode
                        key={rootId}
                        nodeId={rootId}
                        index={index}
                        expandedNodeIds={expandedNodeIds}
                        selectedNodeId={selectedNodeId}
                        onToggle={onToggle}
                    />
                ))}
            </TreeList>
        </TreeRegion>
    )
}
