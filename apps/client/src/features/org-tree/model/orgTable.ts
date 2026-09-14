import type { OrgNode } from './orgNode.ts'
import type { OrgAggregate } from './buildOrgAggregates.ts'

export type SortColumn =
    | 'name'
    | 'level'
    | 'totalHeadcount'
    | 'totalBudget'
    | 'averagePerformance'

export type SortState = { column: SortColumn; direction: 'asc' | 'desc' }

export type OrgTableRow = {
    nodeId: string
    name: string
    level: number
    totalHeadcount: number
    totalBudget: number
    averagePerformance: number | null
}

export function buildOrgTableRows(
    nodes: readonly OrgNode[],
    aggregates: ReadonlyMap<string, OrgAggregate>,
): readonly OrgTableRow[] {
    return nodes.map((node) => {
        const aggregate = aggregates.get(node.id)
        if (!aggregate) {
            throw new Error(`Missing aggregate for node ${node.id}`)
        }

        return {
            nodeId: node.id,
            name: node.name,
            level: aggregate.level,
            totalHeadcount: aggregate.totalHeadcount,
            totalBudget: aggregate.totalBudget,
            averagePerformance: aggregate.averagePerformance,
        }
    })
}

export function filterOrgTableRows(
    rows: readonly OrgTableRow[],
    filterText: string,
): readonly OrgTableRow[] {
    const needle = filterText.trim().toLowerCase()
    if (needle === '') {
        return rows
    }

    return rows.filter((row) => row.name.toLowerCase().includes(needle))
}

export function sortOrgTableRows(
    rows: readonly OrgTableRow[],
    sort: SortState | null,
): readonly OrgTableRow[] {
    if (sort === null) {
        return rows
    }

    const direction = sort.direction === 'asc' ? 1 : -1

    return [...rows].sort((a, b) => {
        switch (sort.column) {
            case 'name':
                return direction * a.name.localeCompare(b.name)
            case 'level':
                return direction * (a.level - b.level)
            case 'totalHeadcount':
                return direction * (a.totalHeadcount - b.totalHeadcount)
            case 'totalBudget':
                return direction * (a.totalBudget - b.totalBudget)
            case 'averagePerformance': {
                if (a.averagePerformance === null && b.averagePerformance === null) {
                    return 0
                }
                if (a.averagePerformance === null) {
                    return 1
                }
                if (b.averagePerformance === null) {
                    return -1
                }
                return direction * (a.averagePerformance - b.averagePerformance)
            }
        }
    })
}
