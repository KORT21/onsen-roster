import type { RosterPayload, RosterWeek } from '../types/roster'

function daysFrom(start: string) {
  const [year, month, day] = start.split('-').map(Number)
  const base = new Date(Date.UTC(year, month - 1, day, 12))
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base)
    date.setUTCDate(base.getUTCDate() + index)
    return {
      date: date.toISOString().slice(0, 10),
      shortLabel: date.toLocaleDateString('en-NZ', { weekday: 'short', timeZone: 'UTC' }),
    }
  })
}

function week(start: string, label: string, offset = 0): RosterWeek {
  const names = ['Alex', 'Casey', 'Jordan', 'Morgan', 'Riley', 'Taylor', 'Jamie', 'Avery', 'Cameron', 'Drew', 'Hayden', 'Quinn']
  const cells = (shift = 0, note = '') => names.map((name, index) => `${names[(index + shift + offset) % names.length]}${note}`)

  return {
    id: start,
    label,
    start,
    days: daysFrom(start),
    rows: [
      { id: `${start}-sup-am`, label: 'Supervisor 7:15am–3:45pm', cells: cells(0) },
      { id: `${start}-fd-1`, label: 'Front Desk 1 7:30am–3:30pm', cells: cells(1) },
      { id: `${start}-spa`, label: 'Spa Host 8:00am–4:00pm', cells: cells(2) },
      { id: `${start}-timer`, label: 'Timers & Comms 8:00am–4:00pm', cells: cells(3) },
      { id: `${start}-runner`, label: 'Runner 1 7:30am–3:30pm', cells: cells(4) },
      { id: `${start}-float`, label: 'Float Runner 11:00am–7:30pm', cells: cells(5, ' *') },
      { id: `${start}-sup-pm`, label: 'Supervisor 3:15pm–Close', cells: cells(6) },
      { id: `${start}-fd-pm`, label: 'Front Desk 1 3:25pm–Close', cells: cells(7) },
      { id: `${start}-runner-pm`, label: 'Runner 1 3:25pm–Close', cells: cells(8) },
      { id: `${start}-driver`, label: 'Late Driver 4:00pm–Close', cells: cells(9) },
    ],
  }
}

export const demoPayload: RosterPayload = {
  version: 1,
  fetchedAt: new Date().toISOString(),
  source: { name: 'Demo roster' },
  weeks: [
    week('2026-11-02', 'WC 2/11'),
    week('2026-11-09', 'WC 9/11', 2),
  ],
}
