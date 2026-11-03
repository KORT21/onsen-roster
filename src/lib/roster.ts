import type { PersonAssignment, RoleMeta, RosterPayload, RosterWeek } from '../types/roster'

const FAMILY_STYLES: Array<{ test: RegExp; family: string; color: string }> = [
  { test: /train/i, family: 'Training', color: '#91a4b0' },
  { test: /supervisor/i, family: 'Supervisor', color: '#cf9f5e' },
  { test: /front desk/i, family: 'Front Desk', color: '#70b8d7' },
  { test: /spa host|spa attendant/i, family: 'Spa', color: '#70b8d7' },
  { test: /ressies|timer|comms/i, family: 'Comms', color: '#ad99da' },
  { test: /runners co/i, family: 'Runner coordinator', color: '#df9469' },
  { test: /float|runner/i, family: 'Runners', color: '#4cb7c4' },
  { test: /driver/i, family: 'Drivers', color: '#c7b88f' },
  { test: /maintenance/i, family: 'Maintenance', color: '#8aa490' },
]

const PLACEHOLDER_RE = /^(to fill|tbc|vacant|no driver needed|spa side|not needed)$/i
const NOTE_TIME_RE = /\b(?:\d{1,2}(?:[:.]\d{1,2})?\s*(?:am|pm)?\s*[–—-]\s*)?\d{1,2}(?:[:.]\d{1,2})?\s*(?:am|pm)\b/i

export function formatDayNotes(values: string[]): string[] {
  const notes: string[] = []

  values.forEach((value) => {
    const clean = value.replace(/\s+/g, ' ').replace(/\s*[–—-]\s*$/, '').trim()
    if (!clean) return

    const time = clean.match(NOTE_TIME_RE)
    if (!time || time.index === undefined) {
      notes.push(clean)
      return
    }

    const before = clean.slice(0, time.index).trim()
    const after = clean.slice(time.index + time[0].length).trim()
    const isTimeContinuation = !before && /^(?:start|finish|until\s+close|close)?$/i.test(after)
    const previous = notes.at(-1)

    if (isTimeContinuation && previous && !NOTE_TIME_RE.test(previous)) {
      notes[notes.length - 1] = `${previous} 🕒 ${clean}`
      return
    }

    notes.push(before ? `${before} 🕒 ${clean.slice(time.index)}` : `🕒 ${clean}`)
  })

  return notes
}

function trainingArea(label: string) {
  if (/front desk/i.test(label)) return { key: 'front-desk', label: 'Front Desk' }
  if (/driver/i.test(label)) return { key: 'driver', label: 'Driver' }
  if (/spa host|spa attendant|\bspa\b/i.test(label)) return { key: 'spa', label: 'Spa' }
  if (/runner/i.test(label)) return { key: 'runner', label: 'Runners' }
  if (/supervisor/i.test(label)) return { key: 'supervisor', label: 'Supervisor' }
  if (/timer|comms|ressies/i.test(label)) return { key: 'comms', label: 'Comms' }

  const clean = label.replace(/\btraining\b/gi, '').replace(/\s+\d.*$/, '').trim()
  return { key: clean.toLocaleLowerCase(), label: clean || 'this role' }
}

function namesList(names: string[]) {
  if (names.length < 2) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`
}

export function deriveDayNotes(week: RosterWeek, dayIndex: number): string[] {
  const explicitNotes = formatDayNotes(week.rows
    .filter((row) => row.kind === 'note' && row.cells[dayIndex])
    .map((row) => row.cells[dayIndex]))
  const farewells: string[] = []
  const trainees = new Map<string, { label: string; names: string[] }>()
  const trainers = new Map<string, string[]>()

  week.rows.forEach((row) => {
    if (row.kind === 'note') return
    const assignment = parseAssignment(row.cells[dayIndex] ?? '')
    if (!assignment?.name || assignment.placeholder) return

    if (/\blast day\b/i.test(assignment.note)) {
      farewells.push(`${assignment.name}’s last day — don’t forget to say your goodbyes. We love you, ${assignment.name}! 💛`)
    }

    const area = trainingArea(row.label)
    if (/\btraining\b/i.test(row.label)) {
      const group = trainees.get(area.key) ?? { label: area.label, names: [] }
      if (!group.names.includes(assignment.name)) group.names.push(assignment.name)
      trainees.set(area.key, group)
    } else if (assignment.training) {
      const names = trainers.get(area.key) ?? []
      if (!names.includes(assignment.name)) names.push(assignment.name)
      trainers.set(area.key, names)
    }
  })

  const trainingNotes = [...trainees.entries()].map(([key, group]) => {
    const trainerNames = trainers.get(key) ?? []
    if (trainerNames.length === 0) {
      return `${namesList(group.names)} ${group.names.length === 1 ? 'is' : 'are'} training on ${group.label}.`
    }
    return `${namesList(trainerNames)} ${trainerNames.length === 1 ? 'is' : 'are'} training ${namesList(group.names)} on ${group.label}.`
  })

  return [...new Set([...farewells, ...trainingNotes, ...explicitNotes])]
}

export function parseAssignment(value: string): PersonAssignment | null {
  const raw = value.trim()
  if (!raw) return null
  if (PLACEHOLDER_RE.test(raw)) {
    return { name: '', note: raw, training: false, placeholder: true }
  }
  const training = raw.includes('*')
  const clean = raw.replace(/\*/g, ' ').replace(/\s+/g, ' ').trim()
  const match = clean.match(/^([\p{L}'-]+(?:\s[A-Z](?![\p{L}]))?)/u)
  if (!match) return null
  return {
    name: match[1].trim(),
    note: clean.slice(match[0].length).replace(/^[\s–—,:-]+/, '').trim(),
    training,
    placeholder: false,
  }
}

export function hasRosteredPerson(value: string): boolean {
  const assignment = parseAssignment(value)
  return Boolean(assignment?.name && !assignment.placeholder)
}

export function namesInCell(value: string): string[] {
  const raw = value.trim()
  if (!raw || PLACEHOLDER_RE.test(raw)) return []
  const ignored = new Set(['Train', 'Training', 'Last', 'Day', 'Start', 'Finish', 'Fin'])
  const matches = raw.match(/\b\p{Lu}[\p{Ll}'-]+(?:\s+\p{Lu}(?![\p{L}]))?/gu) ?? []
  return [...new Set(matches.map((name) => name.trim()).filter((name) => !ignored.has(name)))]
}

export function roleMeta(label: string, index: number, supervisorSplit: number): RoleMeta {
  const tokens = label.trim().split(/\s+/)
  const timeIndex = tokens.findIndex((token) => /^\d{1,2}(?:[:.]\d{2})?(?:am|pm)/i.test(token))
  const title = tokens.slice(0, timeIndex === -1 ? tokens.length : timeIndex).join(' ')
  const time = timeIndex === -1 ? '' : tokens.slice(timeIndex).join(' ')
  const style = FAMILY_STYLES.find((item) => item.test.test(title)) ?? {
    family: title || 'Other',
    color: '#91a4b0',
  }
  let half: RoleMeta['half'] = index >= supervisorSplit ? 'pm' : 'am'
  const start = time.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)/i)
  if (start) {
    const hour = Number(start[1]) % 12 + (start[3].toLocaleLowerCase() === 'pm' ? 12 : 0)
    if (hour >= 14) half = 'pm'
    else if (hour < 11) half = 'am'
    else half = 'both'
  }
  if (/float|mid driver|maintenance/i.test(title)) half = 'both'
  if (/late driver/i.test(title)) half = 'pm'
  return { family: style.family, title, time, color: style.color, half }
}

export function findSupervisorSplit(week: RosterWeek): number {
  let supervisors = 0
  for (let index = 0; index < week.rows.length; index += 1) {
    if (week.rows[index].kind !== 'note' && /^supervisor\b/i.test(week.rows[index].label) && !/training/i.test(week.rows[index].label)) {
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
      if (row.kind === 'note') return
      row.cells.forEach((cell) => {
        namesInCell(cell).forEach((name) => names.set(name.toLocaleLowerCase(), name))
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

export function isoWeekNumber(isoDate: string): number {
  const [year, month, dayOfMonth] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
}

export function assignmentsFor(week: RosterWeek, name: string) {
  const key = name.toLocaleLowerCase()
  return week.days.flatMap((day, dayIndex) =>
    week.rows.flatMap((row, rowIndex) => {
      if (row.kind === 'note') return []
      const cell = row.cells[dayIndex] ?? ''
      if (!namesInCell(cell).some((name) => name.toLocaleLowerCase() === key)) return []
      const parsed = parseAssignment(cell)
      const person = parsed ? { ...parsed, name } : { name, note: cell, training: cell.includes('*'), placeholder: false }
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
