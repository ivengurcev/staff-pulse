import { useCallback, useMemo, useState } from 'react'

import { useOrgTreeQuery } from '../api/useOrgTreeQuery.ts'
import { buildOrgAggregates } from '../model/buildOrgAggregates.ts'
import { buildOrgTreeIndex } from '../model/buildOrgTreeIndex.ts'
import { getAncestorIds } from '../model/getAncestorIds.ts'
import { getInitialExpandedNodeIds } from '../model/getInitialExpandedNodeIds.ts'
import {
    buildOrgTableRows,
    filterOrgTableRows,
    sortOrgTableRows,
    type SortColumn,
    type SortState,
} from '../model/orgTable.ts'
import { OrgTable } from './OrgTable.tsx'
import { OrgTree } from './OrgTree.tsx'
import { ViewToggle } from './ViewToggle.tsx'
import { useDebouncedValue } from './useDebouncedValue.ts'
import { Content, TablePane, ToggleWrap, TreePane } from './orgTable.styles.ts'
import {
    Brand,
    Header,
    HeaderSearch,
    Page,
    Panel,
    RetryButton,
    StateCard,
    StateContent,
    StateTitle,
} from './orgTree.styles.ts'

export function OrgExplorer() {
    const query = useOrgTreeQuery()
    const [expandedNodeIds, setExpandedNodeIds] = useState<ReadonlySet<string> | null>(
        null,
    )
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree')
    const [sort, setSort] = useState<SortState | null>(null)
    const [filterText, setFilterText] = useState('')

    const index = useMemo(
        () => (query.data ? buildOrgTreeIndex(query.data) : null),
        [query.data],
    )
    const aggregates = useMemo(
        () => (query.data && index ? buildOrgAggregates(query.data, index) : null),
        [query.data, index],
    )
    const tableRows = useMemo(
        () =>
            query.data && aggregates ? buildOrgTableRows(query.data, aggregates) : null,
        [query.data, aggregates],
    )
    const debouncedFilterText = useDebouncedValue(filterText, 250)
    const filteredRows = useMemo(
        () => (tableRows ? filterOrgTableRows(tableRows, debouncedFilterText) : null),
        [tableRows, debouncedFilterText],
    )
    const sortedRows = useMemo(
        () => (filteredRows ? sortOrgTableRows(filteredRows, sort) : null),
        [filteredRows, sort],
    )

    const initialExpandedNodeIds = useMemo(
        () => (index ? getInitialExpandedNodeIds(index) : new Set<string>()),
        [index],
    )
    const visibleExpandedNodeIds = expandedNodeIds ?? initialExpandedNodeIds

    const handleToggle = useCallback(
        (nodeId: string) => {
            if (!index?.childrenByParentId.has(nodeId)) {
                return
            }

            setExpandedNodeIds((current) => {
                const next = new Set(current ?? initialExpandedNodeIds)
                if (next.has(nodeId)) {
                    next.delete(nodeId)
                } else {
                    next.add(nodeId)
                }
                return next
            })
        },
        [index, initialExpandedNodeIds],
    )

    const handleSortAsc = useCallback((column: SortColumn) => {
        setSort({ column, direction: 'asc' })
    }, [])

    const handleSortDesc = useCallback((column: SortColumn) => {
        setSort({ column, direction: 'desc' })
    }, [])

    const handleSelectRow = useCallback(
        (nodeId: string) => {
            setSelectedNodeId(nodeId)
            setViewMode('tree')
            if (!index) {
                return
            }

            const ancestorIds = getAncestorIds(nodeId, index)
            setExpandedNodeIds((current) => {
                const next = new Set(current ?? initialExpandedNodeIds)
                for (const ancestorId of ancestorIds) {
                    next.add(ancestorId)
                }
                return next
            })
        },
        [index, initialExpandedNodeIds],
    )

    const handleSelectNode = useCallback((nodeId: string) => {
        setSelectedNodeId(nodeId)
        setViewMode('table')
    }, [])

    const handleFilterChange = useCallback((text: string) => {
        setFilterText(text)
    }, [])

    const handleViewModeChange = useCallback((mode: 'tree' | 'table') => {
        setViewMode(mode)
    }, [])

    return (
        <Page>
            <Header>
                <Brand>Staff Pulse</Brand>
                <HeaderSearch
                    type="search"
                    value={filterText}
                    placeholder="Поиск по подразделениям…"
                    aria-label="Фильтр по названию подразделения"
                    onChange={(event) => handleFilterChange(event.target.value)}
                />
                <ToggleWrap>
                    <ViewToggle viewMode={viewMode} onChange={handleViewModeChange} />
                </ToggleWrap>
            </Header>

            {query.data && query.data.length > 0 && index && sortedRows ? (
                <Content>
                    <TreePane $view={viewMode}>
                        <Panel aria-label="Подразделения">
                            <OrgTree
                                index={index}
                                expandedNodeIds={visibleExpandedNodeIds}
                                selectedNodeId={selectedNodeId}
                                onToggle={handleToggle}
                                onSelectNode={handleSelectNode}
                            />
                        </Panel>
                    </TreePane>
                    <TablePane $view={viewMode}>
                        <OrgTable
                            rows={sortedRows}
                            sort={sort}
                            selectedNodeId={selectedNodeId}
                            onSortAsc={handleSortAsc}
                            onSortDesc={handleSortDesc}
                            onSelectRow={handleSelectRow}
                        />
                    </TablePane>
                </Content>
            ) : (
                <Panel aria-label="Подразделения">
                    {query.data === undefined && query.isPending ? (
                        <StateCard role="status">
                            <StateContent>
                                <StateTitle>Загружаем структуру…</StateTitle>
                                <p>Получаем актуальные данные о подразделениях.</p>
                            </StateContent>
                        </StateCard>
                    ) : null}

                    {query.data === undefined && query.isError ? (
                        <StateCard role="alert">
                            <StateContent>
                                <StateTitle>Не удалось загрузить структуру</StateTitle>
                                <p>Проверьте соединение и попробуйте ещё раз.</p>
                                <RetryButton type="button" onClick={() => void query.refetch()}>
                                    Повторить
                                </RetryButton>
                            </StateContent>
                        </StateCard>
                    ) : null}

                    {query.data?.length === 0 ? (
                        <StateCard>
                            <StateContent>
                                <StateTitle>В структуре пока нет подразделений</StateTitle>
                                <p>Данные появятся здесь после добавления подразделений.</p>
                            </StateContent>
                        </StateCard>
                    ) : null}
                </Panel>
            )}
        </Page>
    )
}
