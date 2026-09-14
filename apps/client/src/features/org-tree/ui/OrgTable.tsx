import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

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

type HighlightColumn = 'totalHeadcount' | 'totalBudget' | 'averagePerformance'

const FADE_OUT_MS = 1500

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
    const tableBodyRef = useRef<HTMLTableSectionElement>(null)
    const prevRowsRef = useRef(rows)
    const [highlighted, setHighlighted] = useState<
        ReadonlyMap<string, ReadonlySet<HighlightColumn>>
    >(new Map())
    const [activeRowIndex, setActiveRowIndex] = useState(-1)

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches
        selectedRowRef.current?.scrollIntoView({
            block: 'nearest',
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
        })
    }, [selectedNodeId])

    useEffect(() => {
        const prevRows = prevRowsRef.current
        prevRowsRef.current = rows

        const prevById = new Map(prevRows.map((row) => [row.nodeId, row]))
        const changed = new Map<string, Set<HighlightColumn>>()

        for (const row of rows) {
            const prev = prevById.get(row.nodeId)
            if (!prev) {
                continue
            }
            const columns = new Set<HighlightColumn>()
            if (row.totalHeadcount !== prev.totalHeadcount) {
                columns.add('totalHeadcount')
            }
            if (row.totalBudget !== prev.totalBudget) {
                columns.add('totalBudget')
            }
            if (row.averagePerformance !== prev.averagePerformance) {
                columns.add('averagePerformance')
            }
            if (columns.size > 0) {
                changed.set(row.nodeId, columns)
            }
        }

        if (changed.size === 0) {
            return
        }

        const timer = setTimeout(() => {
            setHighlighted(changed)
        }, 0)

        return () => clearTimeout(timer)
    }, [rows])

    useEffect(() => {
        if (highlighted.size === 0) {
            return
        }

        const timer = setTimeout(() => {
            setHighlighted(new Map())
        }, FADE_OUT_MS)

        return () => clearTimeout(timer)
    }, [highlighted])

    const focusRow = (index: number): void => {
        const row = tableBodyRef.current?.querySelectorAll('tr')[index]
        if (row instanceof HTMLElement) {
            row.focus()
        }
    }

    const handleKeyDown = (
        event: ReactKeyboardEvent<HTMLTableSectionElement>,
    ): void => {
        if (rows.length === 0) {
            return
        }

        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault()
                const next =
                    activeRowIndex < 0
                        ? 0
                        : Math.min(activeRowIndex + 1, rows.length - 1)
                setActiveRowIndex(next)
                focusRow(next)
                break
            }
            case 'ArrowUp': {
                event.preventDefault()
                const next =
                    activeRowIndex < 0
                        ? rows.length - 1
                        : Math.max(activeRowIndex - 1, 0)
                setActiveRowIndex(next)
                focusRow(next)
                break
            }
            case 'Home': {
                event.preventDefault()
                setActiveRowIndex(0)
                focusRow(0)
                break
            }
            case 'End': {
                event.preventDefault()
                setActiveRowIndex(rows.length - 1)
                focusRow(rows.length - 1)
                break
            }
            case 'Enter': {
                if (activeRowIndex >= 0) {
                    event.preventDefault()
                    const row = rows[activeRowIndex]
                    if (row) {
                        onSelectRow(row.nodeId)
                    }
                }
                break
            }
        }
    }

    const isHighlighted = (nodeId: string, column: HighlightColumn): boolean =>
        highlighted.get(nodeId)?.has(column) ?? false

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
                    <tbody
                        ref={tableBodyRef}
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                    >
                        {rows.map((row, index) => (
                            <TableRow
                                key={row.nodeId}
                                ref={
                                    row.nodeId === selectedNodeId
                                        ? selectedRowRef
                                        : undefined
                                }
                                tabIndex={-1}
                                $selected={row.nodeId === selectedNodeId}
                                $active={index === activeRowIndex}
                                onClick={() => onSelectRow(row.nodeId)}
                            >
                                <Td>{row.name}</Td>
                                <Td>
                                    <LevelBadge $tone={getLevelTone(row.level)}>
                                        {getLevelLabel(row.level)}
                                    </LevelBadge>
                                </Td>
                                <Td
                                    $numeric
                                    $highlight={isHighlighted(
                                        row.nodeId,
                                        'totalHeadcount',
                                    )}
                                >
                                    {row.totalHeadcount}
                                </Td>
                                <Td
                                    $numeric
                                    $highlight={isHighlighted(
                                        row.nodeId,
                                        'totalBudget',
                                    )}
                                >
                                    {formatBudget(row.totalBudget)}
                                </Td>
                                <Td
                                    $numeric
                                    $highlight={isHighlighted(
                                        row.nodeId,
                                        'averagePerformance',
                                    )}
                                >
                                    {formatPerformance(row.averagePerformance)}
                                </Td>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </TableScroll>
        </TablePanel>
    )
}
