const budgetFormatter = new Intl.NumberFormat('ru-RU')

const LEVEL_LABELS = ['Дивизион', 'Отдел', 'Команда'] as const

export type OrgLevelTone = 'division' | 'department' | 'team' | 'unknown'

export const levelColors: Record<
    OrgLevelTone,
    { background: string; foreground: string; marker: string }
> = {
    division: { background: '#eff8ff', foreground: '#175cd3', marker: '#2e90fa' },
    department: { background: '#f4f3ff', foreground: '#6941c6', marker: '#7f56d9' },
    team: { background: '#ecfdf3', foreground: '#067647', marker: '#12b76a' },
    unknown: { background: '#f2f4f7', foreground: '#475467', marker: '#98a2b3' },
}

export function formatBudget(value: number): string {
    return `${budgetFormatter.format(value)} руб.`
}

export function formatPerformance(value: number | null): string {
    if (value === null) {
        return '—'
    }

    return `${value.toLocaleString('ru-RU', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    })}%`
}

export function getLevelLabel(level: number): string {
    return LEVEL_LABELS[level] ?? String(level)
}

export function getLevelTone(level: number): OrgLevelTone {
    return level === 0
        ? 'division'
        : level === 1
          ? 'department'
          : level === 2
            ? 'team'
            : 'unknown'
}
