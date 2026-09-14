import type { OrgAggregate } from './buildOrgAggregates.ts'
import type { OrgTreeIndex } from './buildOrgTreeIndex.ts'
import type { OrgNode } from './orgNode.ts'
import type { OrgSnapshot } from './orgSnapshot.ts'

type Delta = {
    headcount: number
    budget: number
    weightedPerformanceSum: number
}

export function applyOrgNodePatch(
    snapshot: OrgSnapshot,
    node: OrgNode,
): OrgSnapshot {
    const existing = snapshot.index.nodesById.get(node.id)
    if (!existing) {
        return snapshot
    }

    if (node.updatedAt <= existing.updatedAt) {
        return snapshot
    }

    if (node.parentId !== existing.parentId || node.name !== existing.name) {
        return snapshot
    }

    const delta: Delta = {
        headcount: node.headcount - existing.headcount,
        budget: node.budget - existing.budget,
        weightedPerformanceSum:
            node.performance * node.headcount -
            existing.performance * existing.headcount,
    }

    const nodeIndex = snapshot.nodes.findIndex(
        (candidate) => candidate.id === node.id,
    )
    const nodes = [...snapshot.nodes]
    nodes[nodeIndex] = node

    const nodesById = new Map(snapshot.index.nodesById)
    nodesById.set(node.id, node)
    const index: OrgTreeIndex = {
        nodesById,
        childrenByParentId: snapshot.index.childrenByParentId,
        rootIds: snapshot.index.rootIds,
    }

    const aggregates = new Map(snapshot.aggregates)
    let currentId: string | null = node.id
    while (currentId !== null) {
        const aggregate = aggregates.get(currentId)
        if (!aggregate) {
            break
        }
        aggregates.set(currentId, applyDelta(aggregate, delta))
        currentId = snapshot.index.nodesById.get(currentId)?.parentId ?? null
    }

    return { nodes, index, aggregates }
}

function applyDelta(aggregate: OrgAggregate, delta: Delta): OrgAggregate {
    const totalHeadcount = aggregate.totalHeadcount + delta.headcount
    const totalBudget = aggregate.totalBudget + delta.budget
    const weightedPerformanceSum =
        aggregate.weightedPerformanceSum + delta.weightedPerformanceSum

    return {
        ...aggregate,
        totalHeadcount,
        totalBudget,
        weightedPerformanceSum,
        averagePerformance:
            totalHeadcount === 0 ? null : weightedPerformanceSum / totalHeadcount,
    }
}
