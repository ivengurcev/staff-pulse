import styled from 'styled-components'

export const TablePanel = styled.section`
    overflow: hidden;
    border: 1px solid #e4e7ec;
    border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 20px 50px rgb(15 23 42 / 8%);
`

export const TableHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px;
    border-bottom: 1px solid #eaecf0;
`

export const TableTitle = styled.h2`
    margin: 0;
    color: #1d2939;
    font-size: 1rem;
`

export const FilterInput = styled.input`
    width: 220px;
    padding: 8px 12px;
    border: 1px solid #d0d5dd;
    border-radius: 10px;
    color: #344054;
    font: inherit;
    font-size: 0.9rem;

    &::placeholder {
        color: #98a2b3;
    }

    &:focus-visible {
        outline: 3px solid rgb(99 102 241 / 25%);
        outline-offset: 1px;
    }
`

export const TableScroll = styled.div`
    overflow-x: auto;
`

export const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
`

export const Th = styled.th`
    padding: 0;
    text-align: left;
    background: #f9fafb;
    border-bottom: 1px solid #e4e7ec;
`

export const SortButton = styled.button<{ $numeric?: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 6px;
    padding: 12px 16px;
    border: 0;
    background: transparent;
    color: #475467;
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
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

export const SortDirection = styled.span`
    color: #4f46e5;
    font-weight: 800;
`

export const Td = styled.td<{ $numeric?: boolean }>`
    padding: 12px 16px;
    color: #344054;
    border-bottom: 1px solid #f2f4f7;
    text-align: ${({ $numeric }) => ($numeric ? 'right' : 'left')};
    ${({ $numeric }) => ($numeric ? 'font-variant-numeric: tabular-nums; white-space: nowrap;' : '')}
`

export const TableRow = styled.tr<{ $selected: boolean }>`
    cursor: pointer;
    background: ${({ $selected }) => ($selected ? '#eef2ff' : 'transparent')};

    &:hover {
        background: ${({ $selected }) => ($selected ? '#eef2ff' : '#f9fafb')};
    }
`

export const ToggleGroup = styled.div`
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border: 1px solid #e4e7ec;
    border-radius: 12px;
    background: #f9fafb;
`

export const ToggleButton = styled.button<{ $active: boolean }>`
    padding: 8px 16px;
    border: 0;
    border-radius: 9px;
    background: ${({ $active }) => ($active ? '#4f46e5' : 'transparent')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#475467')};
    cursor: pointer;
    font: inherit;
    font-weight: 700;

    &:focus-visible {
        outline: 3px solid rgb(99 102 241 / 30%);
        outline-offset: 2px;
    }
`

export const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;

    @media (min-width: 1280px) {
        flex-direction: row;
        align-items: flex-start;
    }
`

export const ToggleWrap = styled.div`
    @media (min-width: 1280px) {
        display: none;
    }
`

export const TreePane = styled.div<{ $view: 'tree' | 'table' }>`
    @media (min-width: 1280px) {
        min-width: 0;
        flex: 0 0 40%;
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
