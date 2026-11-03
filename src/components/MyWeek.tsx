import { assignmentsFor, findSupervisorSplit, roleMeta, todayIso } from '../lib/roster'
import type { RosterWeek } from '../types/roster'

interface MyWeekProps {
  week: RosterWeek
  selectedName: string
  onChooseName: () => void
  onOpenDay: (dayIndex: number, half: 'am' | 'pm') => void
}

export function MyWeek({ week, selectedName, onChooseName, onOpenDay }: MyWeekProps) {
  if (!selectedName) {
    return (
      <section className="empty-panel">
        <span className="eyebrow">Your roster</span>
        <h2>Choose your name</h2>
        <p>Select yourself once and the app will keep your shifts at the top.</p>
        <button className="primary-button" onClick={onChooseName}>Choose my name</button>
      </section>
    )
  }

  const split = findSupervisorSplit(week)
  const assignments = assignmentsFor(week, selectedName)
  const byDay = new Map<string, typeof assignments>()
  assignments.forEach((assignment) => {
    const current = byDay.get(assignment.day.date) ?? []
    byDay.set(assignment.day.date, [...current, assignment])
  })
  const today = todayIso()

  return (
    <section className="my-week-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Your week</span>
          <h2>{selectedName}</h2>
        </div>
        <span className="count-pill">{assignments.length} shift{assignments.length === 1 ? '' : 's'}</span>
      </div>
      <div className="my-week-list">
        {week.days.map((day, dayIndex) => {
          const dayAssignments = byDay.get(day.date) ?? []
          const assignment = dayAssignments[0]
          const meta = assignment ? roleMeta(assignment.row.label, assignment.rowIndex, split) : null
          return (
            <button
              className={`my-day ${day.date === today ? 'today' : ''} ${assignment ? '' : 'off'}`}
              key={day.date}
              onClick={() => assignment && onOpenDay(dayIndex, meta?.half === 'pm' ? 'pm' : 'am')}
              disabled={!assignment}
            >
              <div className="date-tile">
                <span>{day.shortLabel}</span>
                <strong>{Number(day.date.slice(-2))}</strong>
              </div>
              <i style={{ background: meta?.color ?? 'var(--line)' }} />
              <div className="my-day-copy">
                <strong>{meta ? `${meta.title}${dayAssignments.length > 1 ? ` +${dayAssignments.length - 1}` : ''}` : 'Day off'}</strong>
                <span>{meta?.time || 'No shift rostered'}</span>
              </div>
              {assignment && <b>›</b>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
