import { useEffect, useRef } from 'react'

import type { OrgTableRow, SortColumn, SortState } from '../model/orgTable.ts'
import {
    formatBudget,
    formatPerformance,
    getLevelLabel,
    getLevelTone,
} from './orgTableFormat.ts'
import {
    LevelBadge,
    SortButton,
    SortDirection,
    Table,
    TablePanel,
    TableRow,
    TableScroll,
    Td,
    Th,
} from './orgTable.styles.ts'

type ColumnDefinition = {
    key: SortColumn
    label: string
    numeric?: boolean
}

const COLUMNS: readonly ColumnDefinition[] = [
    { key: 'name', label: 'Подразделение' },
    { key: 'level', label: 'Уровень' },
    { key: 'totalHeadcount', label: 'Всего сотрудников', numeric: true },
    { key: 'totalBudget', label: 'Бюджет суммарный', numeric: true },
    { key: 'averagePerformance', label: 'Средняя эффективность', numeric: true },
]

type OrgTableProps = {
    rows: readonly OrgTableRow[]
    sort: SortState | null
    selectedNodeId: string | null
    onSortAsc: (column: SortColumn) => void
    onSortDesc: (column: SortColumn) => void
    onSelectRow: (nodeId: string) => void
}

export function OrgTable({
    rows,
    sort,
    selectedNodeId,
    onSortAsc,
    onSortDesc,
    onSelectRow,
}: OrgTableProps) {
    const selectedRowRef = useRef<HTMLTableRowElement>(null)

    useEffect(() => {
        selectedRowRef.current?.scrollIntoView({ block: 'nearest' })
    }, [rows, selectedNodeId])

    return (
        <TablePanel aria-label="Аналитическая таблица">
            <TableScroll>
                <Table>
                    <thead>
                        <tr>
                            {COLUMNS.map((column) => {
                                const isActive = sort?.column === column.key
                                const direction = isActive ? sort?.direction : null

                                return (
                                    <Th
                                        key={column.key}
                                        aria-sort={
                                            direction === 'asc'
                                                ? 'ascending'
                                                : direction === 'desc'
                                                  ? 'descending'
                                                  : 'none'
                                        }
                                    >
                                        <SortButton
                                            type="button"
                                            $numeric={column.numeric}
                                            onClick={() => onSortAsc(column.key)}
                                            onDoubleClick={() => onSortDesc(column.key)}
                                        >
                                            {column.label}
                                            <SortDirection
                                                $visible={direction !== null}
                                                aria-hidden="true"
                                            >
                                                {direction === 'desc' ? '▼' : '▲'}
                                            </SortDirection>
                                        </SortButton>
                                    </Th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <TableRow
                                key={row.nodeId}
                                ref={row.nodeId === selectedNodeId ? selectedRowRef : undefined}
                                $selected={row.nodeId === selectedNodeId}
                                onClick={() => onSelectRow(row.nodeId)}
                            >
                                <Td>{row.name}</Td>
                                <Td>
                                    <LevelBadge $tone={getLevelTone(row.level)}>
                                        {getLevelLabel(row.level)}
                                    </LevelBadge>
                                </Td>
                                <Td $numeric>{row.totalHeadcount}</Td>
                                <Td $numeric>{formatBudget(row.totalBudget)}</Td>
                                <Td $numeric>{formatPerformance(row.averagePerformance)}</Td>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </TableScroll>
        </TablePanel>
    )
}
