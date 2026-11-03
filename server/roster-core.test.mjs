import { describe, expect, it } from 'vitest'
import { cleanCell, normalizeSheet } from './roster-core.mjs'

const row = (excelRow, ...values) => ({
  excelRow,
  values: Array.from({ length: 8 }, (_, index) => values[index] ?? ''),
})

describe('public workbook normalization', () => {
  it('cleans spreadsheet noise without changing meaningful text', () => {
    expect(cleanCell('  Jas\u00a0RC   Train Kadek  ')).toBe('Jas RC Train Kadek')
    expect(cleanCell('`')).toBe('')
    expect(cleanCell('2pm fin')).toBe('2pm fin')
  })

  it('recognizes compact WC tab names and keeps note rows and duplicate roles', () => {
    const week = normalizeSheet({
      id: '7',
      name: 'WC 2610',
      rows: [
        row(1, 'October/November', 'Mon 26th', 'Tue 27th', 'Wed 28th', 'Thu 29th', 'Fri 30th', 'Sat 31st', 'Sun 1st'),
        row(2, '', 'TRAINING: 8am in staff room'),
        row(3, 'AM Supervisor', 'Alex'),
        row(4, 'Front Desk 7:30am', 'Sam'),
        row(5, 'Spa Host 8am', 'Jo'),
        row(6, 'Runner 1', 'Ana'),
        row(7, 'Runner 1', 'Mia'),
        row(8, 'PM Supervisor', 'Taylor'),
        row(9, 'Driver Late', 'Morgan'),
      ],
    }, new Date('2026-11-03T00:00:00Z'))

    expect(week).not.toBeNull()
    expect(week.start).toBe('2026-10-26')
    expect(week.days.at(-1).date).toBe('2026-11-01')
    expect(week.rows[0]).toMatchObject({ kind: 'note', label: '' })
    expect(week.rows.filter((entry) => entry.label === 'Runner 1')).toHaveLength(2)
    expect(new Set(week.rows.map((entry) => entry.id)).size).toBe(week.rows.length)
  })

  it('recognizes a one-digit day and month from a compact tab', () => {
    const week = normalizeSheet({
      id: '8',
      name: 'WC 211',
      rows: [
        row(1, 'November', 'Mon 2nd', 'Tue 3rd', 'Wed 4th', 'Thu 5th', 'Fri 6th', 'Sat 7th', 'Sun 8th'),
        row(2, 'AM Supervisor', 'Alex'),
        row(3, 'Front Desk', 'Sam'),
        row(4, 'Spa Host', 'Jo'),
        row(5, 'Runner', 'Ana'),
        row(6, 'PM Supervisor', 'Taylor'),
        row(7, 'Driver Late', 'Morgan'),
      ],
    }, new Date('2026-11-03T00:00:00Z'))

    expect(week.start).toBe('2026-11-02')
  })

  it('rejects unrelated tabs instead of inventing roster data', () => {
    const sheet = {
      id: '9',
      name: 'Notes',
      rows: [row(1, 'Month', 'Mon 2', 'Tue 3', 'Wed 4', 'Thu 5', 'Fri 6', 'Sat 7', 'Sun 8'), row(2, 'Reminder', 'Hello')],
    }
    expect(normalizeSheet(sheet, new Date('2026-11-03T00:00:00Z'))).toBeNull()
  })
})
