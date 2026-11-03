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
  const isPip = selectedName.trim().toLocaleLowerCase() === 'pip'
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
          <h2 className="my-week-name">
            {selectedName}
            {isPip && (
              <svg className="pip-heart" viewBox="0 0 24 24" role="img" aria-label="Love for Pip">
                <path d="M12 20.4S4 15.35 4 9.45A4.35 4.35 0 0 1 12 7a4.35 4.35 0 0 1 8 2.45c0 5.9-8 10.95-8 10.95Z" />
              </svg>
            )}
          </h2>
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
