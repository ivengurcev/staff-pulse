import styled from 'styled-components'

export type PerformanceLevel = 'high' | 'medium' | 'low'

const performanceColors: Record<PerformanceLevel, { background: string; foreground: string }> = {
    high: { background: '#dcfce7', foreground: '#166534' },
    medium: { background: '#fef3c7', foreground: '#92400e' },
    low: { background: '#fee2e2', foreground: '#991b1b' },
}

export const Page = styled.main`
    width: min(100% - 32px, 1040px);
    margin: 0 auto;
    padding: 64px 0;
`

export const Header = styled.header`
    margin-bottom: 32px;
`

export const Eyebrow = styled.p`
    margin: 0 0 8px;
    color: #4f46e5;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
`

export const Title = styled.h1`
    margin: 0;
    color: #172033;
    font-size: clamp(2rem, 5vw, 3.25rem);
    letter-spacing: -0.04em;
    line-height: 1;
`

export const Description = styled.p`
    max-width: 640px;
    margin: 16px 0 0;
    color: #667085;
    font-size: 1rem;
    line-height: 1.65;
`

export const Panel = styled.section`
    overflow: hidden;
    border: 1px solid #e4e7ec;
    border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 20px 50px rgb(15 23 42 / 8%);
`

export const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px;
    border-bottom: 1px solid #eaecf0;
`

export const PanelTitle = styled.h2`
    margin: 0;
    color: #1d2939;
    font-size: 1rem;
`

export const PanelCaption = styled.span`
    color: #98a2b3;
    font-size: 0.8rem;
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
    padding: 8px 0;
    list-style: none;

    & & {
        margin-left: 30px;
        padding: 0;
        border-left: 1px solid #e4e7ec;
    }
`

export const TreeItem = styled.li`
    margin: 0;
`

export const NodeButton = styled.button`
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    text-align: left;

    &:focus-visible {
        position: relative;
        z-index: 1;
        outline: 3px solid rgb(99 102 241 / 25%);
        outline-offset: -3px;
    }
`

export const NodeRow = styled.span<{ $selected?: boolean }>`
    display: flex;
    min-height: 58px;
    align-items: center;
    gap: 12px;
    padding: 10px 24px;
    border-bottom: 1px solid #f2f4f7;
    background: ${({ $selected }) => ($selected ? '#eef2ff' : 'transparent')};

    ${NodeButton}:hover & {
        background: ${({ $selected }) => ($selected ? '#eef2ff' : '#f9fafb')};
    }
`

export const LeafRow = styled(NodeRow)`
    padding-left: 48px;
`

export const Chevron = styled.span`
    display: grid;
    width: 16px;
    flex: 0 0 16px;
    place-items: center;
    color: #667085;
    font-size: 1.1rem;
    font-weight: 700;
`

export const NodeName = styled.span`
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: #344054;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const Headcount = styled.span`
    flex: 0 0 auto;
    color: #667085;
    font-size: 0.82rem;
`

export const Performance = styled.span<{ $level: PerformanceLevel }>`
    display: inline-flex;
    min-width: 108px;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 5px 9px;
    border-radius: 999px;
    background: ${({ $level }) => performanceColors[$level].background};
    color: ${({ $level }) => performanceColors[$level].foreground};
    font-size: 0.75rem;
    font-weight: 750;
`

export const PerformanceDot = styled.span`
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
`

export const MobileLabel = styled.span`
`

export const TreeRegion = styled.div`
    overflow-x: auto;
`
