import styled from 'styled-components'

import { levelColors, type OrgLevelTone } from './orgTableFormat.ts'

export type PerformanceLevel = 'high' | 'medium' | 'low'

const performanceColors: Record<PerformanceLevel, { background: string; foreground: string }> = {
    high: { background: '#dcfce7', foreground: '#166534' },
    medium: { background: '#fef3c7', foreground: '#92400e' },
    low: { background: '#fee2e2', foreground: '#991b1b' },
}

export const Page = styled.main`
    --app-header-height: 54px;
    --sticky-gap: 12px;
    --sticky-viewport-padding: 16px;

    width: min(100% - 32px, 1600px);
    margin: 0 auto;
    padding: 0 0 24px;
`

export const Header = styled.header`
    position: sticky;
    z-index: 20;
    top: 0;
    display: flex;
    min-height: 54px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    padding: 10px 14px;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 4px 14px rgb(15 23 42 / 4%);

    @media (min-width: 1280px) {
        height: var(--app-header-height);
    }

    @media (max-width: 900px) {
        flex-wrap: wrap;
    }
`

export const Brand = styled.h1`
    margin: 0;
    color: #172033;
    font-size: 1.05rem;
    font-weight: 850;
    letter-spacing: 0.04em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
`

export const HeaderSearch = styled.input`
    min-width: 0;
    width: min(480px, 50vw);
    margin-left: auto;
    padding: 8px 12px;
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    background: #ffffff;
    color: #344054;
    font: inherit;
    font-size: 0.85rem;

    &::placeholder {
        color: #98a2b3;
    }

    &:focus-visible {
        outline: 3px solid rgb(99 102 241 / 20%);
        outline-offset: 1px;
    }

    @media (max-width: 900px) {
        order: 3;
        width: 100%;
        flex-basis: 100%;
        margin-left: 0;
    }
`

export const Panel = styled.section`
    overflow: hidden;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 4px 14px rgb(15 23 42 / 4%);
`

export const StateCard = styled.div`
    display: grid;
    min-height: 280px;
    place-items: center;
    padding: 32px;
    color: #667085;
    text-align: center;
`

export const StateContent = styled.div`
    display: grid;
    max-width: 420px;
    justify-items: center;
    gap: 12px;

    p {
        margin: 0;
        line-height: 1.6;
    }
`

export const StateTitle = styled.h2`
    margin: 0;
    color: #1d2939;
    font-size: 1.1rem;
`

export const RetryButton = styled.button`
    margin-top: 4px;
    padding: 10px 16px;
    border: 0;
    border-radius: 10px;
    background: #4f46e5;
    color: #ffffff;
    cursor: pointer;
    font: inherit;
    font-weight: 700;

    &:hover {
        background: #4338ca;
    }

    &:focus-visible {
        outline: 3px solid rgb(99 102 241 / 30%);
        outline-offset: 2px;
    }
`

export const TreeList = styled.ul`
    margin: 0;
    padding: 4px 0;
    list-style: none;

    & & {
        margin-left: 14px;
        padding: 0;
        border-left: 1px solid #e4e7ec;
    }
`

export const TreeItem = styled.li`
    margin: 0;
`

export const NodeRow = styled.span<{ $selected?: boolean }>`
    display: flex;
    min-height: 32px;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-bottom: 1px solid #f2f4f7;
    background: ${({ $selected }) => ($selected ? '#eef2ff' : 'transparent')};

    &:hover {
        background: ${({ $selected }) => ($selected ? '#eef2ff' : '#f9fafb')};
    }
`

export const ChevronButton = styled.button`
    display: grid;
    width: 22px;
    height: 26px;
    flex: 0 0 22px;
    place-items: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    text-align: left;

    &:focus-visible {
        outline: 3px solid rgb(99 102 241 / 25%);
        outline-offset: -2px;
    }
`

export const ChevronSpacer = styled.span`
    width: 22px;
    flex: 0 0 22px;
`

export const NodeSelectButton = styled.button`
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    gap: 5px;
    padding: 3px 2px 3px 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    text-align: left;

    &:focus-visible {
        outline: 3px solid rgb(99 102 241 / 25%);
        outline-offset: -2px;
    }
`

export const Chevron = styled.span`
    display: grid;
    width: 14px;
    flex: 0 0 14px;
    place-items: center;
    color: #667085;
    font-size: 0.9rem;
    font-weight: 700;
`

export const NodeName = styled.span`
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: #344054;
    font-size: 0.76rem;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const LevelMarker = styled.span<{ $tone: OrgLevelTone }>`
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 50%;
    background: ${({ $tone }) => levelColors[$tone].marker};
`

export const Headcount = styled.span`
    flex: 0 0 auto;
    color: #667085;
    font-size: 0.67rem;
`

export const Performance = styled.span<{ $level: PerformanceLevel }>`
    display: inline-flex;
    min-width: 86px;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 2px 5px;
    border-radius: 999px;
    background: ${({ $level }) => performanceColors[$level].background};
    color: ${({ $level }) => performanceColors[$level].foreground};
    font-size: 0.64rem;
    font-weight: 750;
`

export const PerformanceDot = styled.span`
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
`

export const MobileLabel = styled.span`
`

export const TreeRegion = styled.div`
    overflow-x: auto;
`
