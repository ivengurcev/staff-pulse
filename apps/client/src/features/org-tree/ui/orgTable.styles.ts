import styled from 'styled-components'

import { levelColors, type OrgLevelTone } from './orgTableFormat.ts'

export const TablePanel = styled.section`
    overflow: hidden;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 4px 14px rgb(15 23 42 / 4%);
`

export const TableScroll = styled.div`
    overflow-x: auto;

    @media (min-width: 1280px) {
        overflow-x: hidden;
    }
`

export const Table = styled.table`
    width: 100%;
    min-width: 800px;
    border-collapse: collapse;
    font-size: 0.78rem;

    @media (min-width: 1280px) {
        min-width: 0;
        table-layout: fixed;
    }
`

export const Th = styled.th`
    padding: 0;
    text-align: left;
    background: #f9fafb;
    border-bottom: 1px solid #e4e7ec;

    &:nth-child(1) {
        width: 24%;
    }

    &:nth-child(2) {
        width: 14%;
    }

    &:nth-child(3) {
        width: 17%;
    }

    &:nth-child(4) {
        width: 23%;
    }

    &:nth-child(5) {
        width: 22%;
    }
`

export const SortButton = styled.button<{ $numeric?: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 4px;
    padding: 10px;
    border: 0;
    background: transparent;
    color: #475467;
    cursor: pointer;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 700;
    justify-content: ${({ $numeric }) => ($numeric ? 'flex-end' : 'flex-start')};

    &:hover {
        color: #1d2939;
    }

    &:focus-visible {
        outline: 3px solid rgb(99 102 241 / 25%);
        outline-offset: -3px;
    }
`

export const SortDirection = styled.span<{ $visible: boolean }>`
    width: 0.8em;
    flex: 0 0 0.8em;
    color: #4f46e5;
    font-weight: 800;
    visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
`

export const Td = styled.td<{ $numeric?: boolean }>`
    overflow: hidden;
    padding: 9px 10px;
    color: #344054;
    border-bottom: 1px solid #f2f4f7;
    text-overflow: ellipsis;
    text-align: ${({ $numeric }) => ($numeric ? 'right' : 'left')};
    ${({ $numeric }) => ($numeric ? 'font-variant-numeric: tabular-nums; white-space: nowrap;' : '')}
`

export const LevelBadge = styled.span<{ $tone: OrgLevelTone }>`
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: 999px;
    background: ${({ $tone }) => levelColors[$tone].background};
    color: ${({ $tone }) => levelColors[$tone].foreground};
    font-size: 0.68rem;
    font-weight: 750;
    white-space: nowrap;
`

export const TableRow = styled.tr<{ $selected: boolean }>`
    cursor: pointer;
    scroll-margin-block:
        calc(var(--app-header-height) + var(--sticky-gap) + 8px)
        12px;
    background: ${({ $selected }) => ($selected ? '#eef2ff' : 'transparent')};

    &:hover {
        background: ${({ $selected }) => ($selected ? '#eef2ff' : '#f9fafb')};
    }
`

export const ToggleGroup = styled.div`
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    border: 1px solid #e4e7ec;
    border-radius: 8px;
    background: #f9fafb;
`

export const ToggleButton = styled.button<{ $active: boolean }>`
    padding: 3px 10px;
    border: 0;
    border-radius: 6px;
    background: ${({ $active }) => ($active ? '#4f46e5' : 'transparent')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#475467')};
    cursor: pointer;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1;

    &:focus-visible {
        outline: 3px solid rgb(99 102 241 / 30%);
        outline-offset: 2px;
    }
`

export const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;

    @media (min-width: 1280px) {
        flex-direction: row;
        align-items: flex-start;
    }
`

export const ToggleWrap = styled.div`
    display: inline-flex;
    flex: 0 0 auto;

    @media (min-width: 1280px) {
        display: none;
    }
`

export const TreePane = styled.div<{ $view: 'tree' | 'table' }>`
    @media (min-width: 1280px) {
        position: sticky;
        top: calc(var(--app-header-height) + var(--sticky-gap));
        min-width: 0;
        width: 350px;
        max-height: calc(
            100vh - var(--app-header-height) - var(--sticky-gap) -
                var(--sticky-viewport-padding)
        );
        flex: 0 0 350px;
        overflow-y: auto;
        scrollbar-gutter: stable;
    }

    @media (max-width: 1279.98px) {
        display: ${({ $view }) => ($view === 'tree' ? 'block' : 'none')};
    }
`

export const TablePane = styled.div<{ $view: 'tree' | 'table' }>`
    @media (min-width: 1280px) {
        min-width: 0;
        flex: 1 1 60%;
    }

    @media (max-width: 1279.98px) {
        display: ${({ $view }) => ($view === 'table' ? 'block' : 'none')};
    }
`
