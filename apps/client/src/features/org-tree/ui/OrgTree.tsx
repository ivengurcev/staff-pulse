import type { OrgTreeIndex } from '../model/buildOrgTreeIndex.ts'
import { OrgTreeNode } from './OrgTreeNode.tsx'
import { TreeList, TreeRegion } from './orgTree.styles.ts'

type OrgTreeProps = {
    index: OrgTreeIndex
    expandedNodeIds: ReadonlySet<string>
    selectedNodeId: string | null
    onToggle: (nodeId: string) => void
    onSelectNode: (nodeId: string) => void
}

export function OrgTree({
    index,
    expandedNodeIds,
    selectedNodeId,
    onToggle,
    onSelectNode,
}: OrgTreeProps) {
    return (
        <TreeRegion>
            <TreeList aria-label="Организационная структура">
                {index.rootIds.map((rootId) => (
                    <OrgTreeNode
                        key={rootId}
                        nodeId={rootId}
                        level={0}
                        index={index}
                        expandedNodeIds={expandedNodeIds}
                        selectedNodeId={selectedNodeId}
                        onToggle={onToggle}
                        onSelectNode={onSelectNode}
                    />
                ))}
            </TreeList>
        </TreeRegion>
    )
}
