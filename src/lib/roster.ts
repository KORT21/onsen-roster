import type { PersonAssignment, RoleMeta, RosterPayload, RosterWeek } from '../types/roster'

const FAMILY_STYLES: Array<{ test: RegExp; family: string; color: string }> = [
  { test: /supervisor/i, family: 'Supervisor', color: '#d4a45f' },
  { test: /front desk/i, family: 'Front Desk', color: '#70b8d7' },
  { test: /spa host|spa attendant/i, family: 'Spa', color: '#70b8d7' },
  { test: /ressies|timer|comms/i, family: 'Comms', color: '#ad99da' },
  { test: /runners co/i, family: 'Runner coordinator', color: '#df9469' },
  { test: /float|runner/i, family: 'Runners', color: '#4cb7c4' },
  { test: /driver/i, family: 'Drivers', color: '#c7b88f' },
  { test: /train/i, family: 'Training', color: '#91a4b0' },
]

export function parseAssignment(value: string): PersonAssignment | null {
  const raw = value.trim()
  if (!raw) return null
  const training = raw.includes('*')
  const clean = raw.replace(/\*/g, ' ').replace(/\s+/g, ' ').trim()
  const match = clean.match(/^([\p{L}'-]+(?:\s[A-Z](?![\p{L}]))?)/u)
  if (!match) return null
  return {
    name: match[1].trim(),
    note: clean.slice(match[0].length).replace(/^[\s–—,:-]+/, '').trim(),
    training,
  }
}

export function roleMeta(label: string, index: number, supervisorSplit: number): RoleMeta {
  const tokens = label.trim().split(/\s+/)
  const timeIndex = tokens.findIndex((token) => /^\d{1,2}(?::\d{2})?(?:am|pm)/i.test(token))
  const title = tokens.slice(0, timeIndex === -1 ? tokens.length : timeIndex).join(' ')
  const time = timeIndex === -1 ? '' : tokens.slice(timeIndex).join(' ')
  const style = FAMILY_STYLES.find((item) => item.test.test(title)) ?? {
    family: title || 'Other',
    color: '#91a4b0',
  }
  let half: RoleMeta['half'] = index >= supervisorSplit ? 'pm' : 'am'
  if (/float|mid driver/i.test(title)) half = 'both'
  if (/late driver/i.test(title)) half = 'pm'
  return { family: style.family, title, time, color: style.color, half }
}

export function findSupervisorSplit(week: RosterWeek): number {
  let supervisors = 0
  for (let index = 0; index < week.rows.length; index += 1) {
    if (/supervisor/i.test(week.rows[index].label)) {
      supervisors += 1
      if (supervisors === 2) return index
    }
  }
  return week.rows.length
}

export function peopleIn(payload: RosterPayload): string[] {
  const names = new Map<string, string>()
  payload.weeks.forEach((week) => {
    week.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        const assignment = parseAssignment(cell)
        if (assignment) names.set(assignment.name.toLocaleLowerCase(), assignment.name)
      })
    })
  })
  return [...names.values()].sort((a, b) => a.localeCompare(b))
}

export function closestWeekIndex(weeks: RosterWeek[], today = new Date()): number {
  const iso = today.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
  let best = 0
  weeks.forEach((week, index) => {
    if (week.start <= iso) best = index
  })
  return best
}

export function todayIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
}

export function assignmentsFor(week: RosterWeek, name: string) {
  const key = name.toLocaleLowerCase()
  return week.days.flatMap((day, dayIndex) =>
    week.rows.flatMap((row, rowIndex) => {
      const person = parseAssignment(row.cells[dayIndex] ?? '')
      if (!person || person.name.toLocaleLowerCase() !== key) return []
      return [{ day, row, rowIndex, person }]
    }),
  )
}

export function isRosterPayload(value: unknown): value is RosterPayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<RosterPayload>
  return payload.version === 1 && Array.isArray(payload.weeks) && payload.weeks.every((week) => (
    typeof week?.start === 'string' && Array.isArray(week?.days) && Array.isArray(week?.rows)
  ))
}
