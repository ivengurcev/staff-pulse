import { useCallback, useMemo, useState } from 'react'

import { useOrgTreeQuery } from '../api/useOrgTreeQuery.ts'
import { buildOrgTreeIndex } from '../model/buildOrgTreeIndex.ts'
import { getInitialExpandedNodeIds } from '../model/getInitialExpandedNodeIds.ts'
import { OrgTree } from './OrgTree.tsx'
import {
    Description,
    Eyebrow,
    Header,
    Page,
    Panel,
    PanelCaption,
    PanelHeader,
    PanelTitle,
    RetryButton,
    StateCard,
    StateContent,
    StateTitle,
    Title,
} from './orgTree.styles.ts'

export function OrgExplorer() {
    const query = useOrgTreeQuery()
    const [expandedNodeIds, setExpandedNodeIds] = useState<ReadonlySet<string> | null>(
        null,
    )
    const index = useMemo(
        () => (query.data ? buildOrgTreeIndex(query.data) : null),
        [query.data],
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

    return (
        <Page>
            <Header>
                <Eyebrow>Staff Pulse</Eyebrow>
                <Title>Структура компании</Title>
                <Description>
                    Интерактивная карта дивизионов, отделов и команд с актуальной
                    численностью и показателями эффективности.
                </Description>
            </Header>

            <Panel aria-labelledby="org-tree-title">
                <PanelHeader>
                    <PanelTitle id="org-tree-title">Подразделения</PanelTitle>
                    <PanelCaption>Дивизионы · отделы · команды</PanelCaption>
                </PanelHeader>

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

                {query.data && query.data.length > 0 && index ? (
                    <OrgTree
                        index={index}
                        expandedNodeIds={visibleExpandedNodeIds}
                        onToggle={handleToggle}
                    />
                ) : null}
            </Panel>
        </Page>
    )
}
