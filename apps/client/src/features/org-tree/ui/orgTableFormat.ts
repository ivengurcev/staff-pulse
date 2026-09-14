const budgetFormatter = new Intl.NumberFormat('ru-RU')

const LEVEL_LABELS = ['Дивизион', 'Отдел', 'Команда'] as const

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
