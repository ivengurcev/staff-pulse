import type { OrgNode } from './orgNode.ts'
import type { OrgTreeIndex } from './buildOrgTreeIndex.ts'

export type OrgAggregate = {
    nodeId: string
    level: number
    totalHeadcount: number
    totalBudget: number
    weightedPerformanceSum: number
    averagePerformance: number | null
}

type Aggregation = {
    totalHeadcount: number
    totalBudget: number
    weightedPerformanceSum: number
}

export function buildOrgAggregates(
    nodes: readonly OrgNode[],
    index: OrgTreeIndex,
): ReadonlyMap<string, OrgAggregate> {
    const aggregates = new Map<string, OrgAggregate>()

    const visit = (nodeId: string, level: number): Aggregation => {
        const node = index.nodesById.get(nodeId)
        if (!node) {
            throw new Error(`Node ${nodeId} not found in index`)
        }

        const childIds = index.childrenByParentId.get(nodeId) ?? []
        let totalHeadcount = node.headcount
        let totalBudget = node.budget
        let weightedPerformanceSum = node.performance * node.headcount

        for (const childId of childIds) {
            const child = visit(childId, level + 1)
            totalHeadcount += child.totalHeadcount
            totalBudget += child.totalBudget
            weightedPerformanceSum += child.weightedPerformanceSum
        }

        aggregates.set(nodeId, {
            nodeId,
            level,
            totalHeadcount,
            totalBudget,
            weightedPerformanceSum,
            averagePerformance:
                totalHeadcount === 0 ? null : weightedPerformanceSum / totalHeadcount,
        })

        return { totalHeadcount, totalBudget, weightedPerformanceSum }
    }

    for (const rootId of index.rootIds) {
        visit(rootId, 0)
    }

    for (const node of nodes) {
        if (!aggregates.has(node.id)) {
            throw new Error(`No aggregate computed for node ${node.id}`)
        }
    }

    return aggregates
}
