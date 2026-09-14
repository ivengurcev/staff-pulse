import type { OrgTreeIndex } from '../model/buildOrgTreeIndex.ts'
import {
    Chevron,
    Headcount,
    LeafRow,
    MobileLabel,
    NodeButton,
    NodeName,
    NodeRow,
    Performance,
    PerformanceDot,
    TreeItem,
    TreeList,
    type PerformanceLevel,
} from './orgTree.styles.ts'

type OrgTreeNodeProps = {
    nodeId: string
    index: OrgTreeIndex
    expandedNodeIds: ReadonlySet<string>
    onToggle: (nodeId: string) => void
}

export function OrgTreeNode({
    nodeId,
    index,
    expandedNodeIds,
    onToggle,
}: OrgTreeNodeProps) {
    const node = index.nodesById.get(nodeId)

    if (!node) {
        return null
    }

    const childIds = index.childrenByParentId.get(nodeId) ?? []
    const hasChildren = childIds.length > 0
    const isExpanded = expandedNodeIds.has(nodeId)
    const performanceLevel: PerformanceLevel =
        node.performance >= 80 ? 'high' : node.performance >= 60 ? 'medium' : 'low'
    const performanceLabel =
        performanceLevel === 'high'
            ? 'Высокая'
            : performanceLevel === 'medium'
              ? 'Средняя'
              : 'Низкая'

    const content = (
        <>
            <NodeName>{node.name}</NodeName>
            <Headcount>{node.headcount} сотрудников</Headcount>
            <Performance $level={performanceLevel}>
                <PerformanceDot aria-hidden="true" />
                {node.performance}% <MobileLabel>· {performanceLabel}</MobileLabel>
            </Performance>
        </>
    )

    return (
        <TreeItem>
            {hasChildren ? (
                <NodeButton
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => onToggle(nodeId)}
                >
                    <NodeRow>
                        <Chevron aria-hidden="true">{isExpanded ? '⌄' : '›'}</Chevron>
                        {content}
                    </NodeRow>
                </NodeButton>
            ) : (
                <LeafRow>{content}</LeafRow>
            )}

            {hasChildren && isExpanded ? (
                <TreeList>
                    {childIds.map((childId) => (
                        <OrgTreeNode
                            key={childId}
                            nodeId={childId}
                            index={index}
                            expandedNodeIds={expandedNodeIds}
                            onToggle={onToggle}
                        />
                    ))}
                </TreeList>
            ) : null}
        </TreeItem>
    )
}
