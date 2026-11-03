import { findSupervisorSplit, formatDayNotes, namesInCell, parseAssignment, roleMeta } from '../lib/roster'
import type { RosterWeek } from '../types/roster'

interface FullRosterProps {
  week: RosterWeek
  dayIndex: number
  half: 'am' | 'pm'
  selectedName: string
  onDayChange: (index: number) => void
  onHalfChange: (half: 'am' | 'pm') => void
}

export function FullRoster({ week, dayIndex, half, selectedName, onDayChange, onHalfChange }: FullRosterProps) {
  const split = findSupervisorSplit(week)
  const groups = new Map<string, { color: string; entries: Array<{ id: string; title: string; time: string; value: string }> }>()

  week.rows.forEach((row, index) => {
    if (row.kind === 'note') return
    const meta = roleMeta(row.label, index, split)
    if (meta.half !== half && meta.half !== 'both') return
    const value = row.cells[dayIndex] ?? ''
    if (!groups.has(meta.family)) groups.set(meta.family, { color: meta.color, entries: [] })
    groups.get(meta.family)?.entries.push({ id: row.id, title: meta.title, time: meta.time, value })
  })

  const notes = formatDayNotes(week.rows
    .filter((row) => row.kind === 'note' && row.cells[dayIndex])
    .map((row) => row.cells[dayIndex]))

  return (
    <section>
      <div className="day-strip" aria-label="Choose a day">
        {week.days.map((day, index) => (
          <button className={index === dayIndex ? 'active' : ''} key={day.date} onClick={() => onDayChange(index)}>
            <span>{day.shortLabel}</span>
            <strong>{Number(day.date.slice(-2))}</strong>
          </button>
        ))}
      </div>

      <div className="segment">
        <button className={half === 'am' ? 'active' : ''} onClick={() => onHalfChange('am')}>Morning</button>
        <button className={half === 'pm' ? 'active' : ''} onClick={() => onHalfChange('pm')}>Afternoon</button>
      </div>

      {notes.length > 0 && (
        <div className="day-notes">
          {notes.map((note, index) => <div key={`${note}-${index}`}>● {note}</div>)}
        </div>
      )}

      <div className="roster-heading">
        <span className="eyebrow">{week.days[dayIndex].shortLabel} {Number(week.days[dayIndex].date.slice(-2))}</span>
        <h2>{half === 'am' ? 'Morning roster' : 'Afternoon roster'}</h2>
      </div>

      <div className="role-groups">
        {[...groups.entries()].map(([family, group]) => (
          <article className="role-group" key={family}>
            <header><i style={{ background: group.color }} /><span>{family}</span></header>
            <div className="role-card">
              {group.entries.map((entry) => {
                const assignment = parseAssignment(entry.value)
                const isMine = namesInCell(entry.value).some((name) => name.toLocaleLowerCase() === selectedName.toLocaleLowerCase())
                return (
                  <div className={`role-row ${isMine ? 'mine' : ''}`} key={entry.id}>
                    <i style={{ background: group.color }} />
                    <div className="role-copy">
                      <strong>{entry.title}</strong>
                      <span>{entry.time}</span>
                    </div>
                    <div className="person-copy">
                      <strong>{assignment?.placeholder ? assignment.note : assignment?.name || '—'}</strong>
                      {assignment?.training && <span>Training</span>}
                      {assignment?.note && !assignment.placeholder && <span>{assignment.note}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
