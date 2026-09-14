import type { OrgTableRow, SortColumn, SortState } from '../model/orgTable.ts'
import { formatBudget, formatPerformance, getLevelLabel } from './orgTableFormat.ts'
import {
    FilterInput,
    SortButton,
    SortDirection,
    Table,
    TableHeader,
    TablePanel,
    TableRow,
    TableScroll,
    TableTitle,
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
    filterText: string
    onSortAsc: (column: SortColumn) => void
    onSortDesc: (column: SortColumn) => void
    onSelectRow: (nodeId: string) => void
    onFilterChange: (text: string) => void
}

export function OrgTable({
    rows,
    sort,
    selectedNodeId,
    filterText,
    onSortAsc,
    onSortDesc,
    onSelectRow,
    onFilterChange,
}: OrgTableProps) {
    return (
        <TablePanel aria-labelledby="org-table-title">
            <TableHeader>
                <TableTitle id="org-table-title">Аналитическая таблица</TableTitle>
                <FilterInput
                    type="search"
                    value={filterText}
                    placeholder="Фильтр по названию…"
                    aria-label="Фильтр по названию"
                    onChange={(event) => onFilterChange(event.target.value)}
                />
            </TableHeader>
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
                                            {direction ? (
                                                <SortDirection>
                                                    {direction === 'asc' ? '▲' : '▼'}
                                                </SortDirection>
                                            ) : null}
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
                                $selected={row.nodeId === selectedNodeId}
                                onClick={() => onSelectRow(row.nodeId)}
                            >
                                <Td>{row.name}</Td>
                                <Td>{getLevelLabel(row.level)}</Td>
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
