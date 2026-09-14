import { useEffect, useRef } from 'react'

import type { OrgTreeIndex } from '../model/buildOrgTreeIndex.ts'
import { getLevelTone } from './orgTableFormat.ts'
import {
    Chevron,
    ChevronButton,
    ChevronSpacer,
    Headcount,
    LevelMarker,
    MobileLabel,
    NodeName,
    NodeRow,
    NodeSelectButton,
    Performance,
    PerformanceDot,
    TreeItem,
    TreeList,
    type PerformanceLevel,
} from './orgTree.styles.ts'

type OrgTreeNodeProps = {
    nodeId: string
    level: number
    index: OrgTreeIndex
    expandedNodeIds: ReadonlySet<string>
    selectedNodeId: string | null
    onToggle: (nodeId: string) => void
    onSelectNode: (nodeId: string) => void
}

export function OrgTreeNode({
    nodeId,
    level,
    index,
    expandedNodeIds,
    selectedNodeId,
    onToggle,
    onSelectNode,
}: OrgTreeNodeProps) {
    const node = index.nodesById.get(nodeId)
    const isSelected = nodeId === selectedNodeId
    const rowRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (isSelected) {
            rowRef.current?.scrollIntoView({ block: 'nearest' })
        }
    }, [isSelected])

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
    const levelTone = getLevelTone(level)

    const content = (
        <>
            <LevelMarker $tone={levelTone} aria-hidden="true" />
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
            <NodeRow ref={rowRef} $selected={isSelected}>
                {hasChildren ? (
                    <ChevronButton
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Свернуть' : 'Раскрыть'} ${node.name}`}
                        onClick={() => onToggle(nodeId)}
                    >
                        <Chevron aria-hidden="true">{isExpanded ? '⌄' : '›'}</Chevron>
                    </ChevronButton>
                ) : (
                    <ChevronSpacer aria-hidden="true" />
                )}
                <NodeSelectButton
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => onSelectNode(nodeId)}
                >
                    {content}
                </NodeSelectButton>
            </NodeRow>

            {hasChildren && isExpanded ? (
                <TreeList>
                    {childIds.map((childId) => (
                        <OrgTreeNode
                            key={childId}
                            nodeId={childId}
                            level={level + 1}
                            index={index}
                            expandedNodeIds={expandedNodeIds}
                            selectedNodeId={selectedNodeId}
                            onToggle={onToggle}
                            onSelectNode={onSelectNode}
                        />
                    ))}
                </TreeList>
            ) : null}
        </TreeItem>
    )
}
