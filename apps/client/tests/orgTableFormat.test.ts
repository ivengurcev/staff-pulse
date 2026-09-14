import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
    getLevelLabel,
    getLevelTone,
    levelColors,
} from '../src/features/org-tree/ui/orgTableFormat.ts'

describe('organization level presentation', () => {
    it('maps hierarchy depth to the expected label and tone', () => {
        assert.deepEqual(
            [0, 1, 2].map((level) => ({
                label: getLevelLabel(level),
                tone: getLevelTone(level),
            })),
            [
                { label: 'Дивизион', tone: 'division' },
                { label: 'Отдел', tone: 'department' },
                { label: 'Команда', tone: 'team' },
            ],
        )
    })

    it('uses a distinct marker color for each known hierarchy level', () => {
        const markerColors = [
            levelColors.division.marker,
            levelColors.department.marker,
            levelColors.team.marker,
        ]

        assert.equal(new Set(markerColors).size, markerColors.length)
    })

    it('uses a neutral fallback for an unknown hierarchy level', () => {
        assert.equal(getLevelLabel(7), '7')
        assert.equal(getLevelTone(7), 'unknown')
    })
})
