import { ToggleButton, ToggleGroup } from './orgTable.styles.ts'

type ViewToggleProps = {
    viewMode: 'tree' | 'table'
    onChange: (mode: 'tree' | 'table') => void
}

export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
    return (
        <ToggleGroup role="group" aria-label="Выбор представления">
            <ToggleButton
                type="button"
                $active={viewMode === 'tree'}
                aria-pressed={viewMode === 'tree'}
                onClick={() => onChange('tree')}
            >
                Дерево
            </ToggleButton>
            <ToggleButton
                type="button"
                $active={viewMode === 'table'}
                aria-pressed={viewMode === 'table'}
                onClick={() => onChange('table')}
            >
                Таблица
            </ToggleButton>
        </ToggleGroup>
    )
}
