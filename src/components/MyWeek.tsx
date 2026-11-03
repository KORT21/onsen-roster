import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { assignmentsFor, findSupervisorSplit, roleMeta, todayIso } from '../lib/roster'
import type { RosterWeek } from '../types/roster'

const floaters = [
  { left: 8, drift: 28, sway: -12, delay: 90, duration: 3500, size: 27, rotate: -14 },
  { left: 17, drift: -24, sway: 18, delay: 460, duration: 3900, size: 38, rotate: 12 },
  { left: 27, drift: 38, sway: -14, delay: 180, duration: 3250, size: 22, rotate: -8 },
  { left: 36, drift: -30, sway: 22, delay: 630, duration: 4100, size: 32, rotate: 15 },
  { left: 44, drift: 24, sway: -20, delay: 20, duration: 3750, size: 45, rotate: -10 },
  { left: 51, drift: -18, sway: 16, delay: 310, duration: 3300, size: 25, rotate: 9 },
  { left: 58, drift: 34, sway: -18, delay: 720, duration: 4200, size: 34, rotate: -16 },
  { left: 65, drift: -38, sway: 24, delay: 150, duration: 3600, size: 29, rotate: 13 },
  { left: 73, drift: 26, sway: -15, delay: 520, duration: 3950, size: 42, rotate: -11 },
  { left: 83, drift: -28, sway: 19, delay: 250, duration: 3400, size: 23, rotate: 14 },
  { left: 91, drift: -34, sway: 14, delay: 780, duration: 4050, size: 31, rotate: -12 },
  { left: 23, drift: 32, sway: -22, delay: 920, duration: 3500, size: 19, rotate: 8 },
  { left: 48, drift: -25, sway: 20, delay: 1050, duration: 3900, size: 28, rotate: -14 },
  { left: 77, drift: 30, sway: -16, delay: 980, duration: 3650, size: 20, rotate: 11 },
  { left: 57, drift: 16, sway: -13, delay: 1180, duration: 3350, size: 18, rotate: -9 },
] as const

type FloaterStyle = CSSProperties & {
  '--float-left': string
  '--float-drift': string
  '--float-sway': string
  '--float-delay': string
  '--float-duration': string
  '--float-size': string
  '--float-rotate': string
}

interface MyWeekProps {
  week: RosterWeek
  selectedName: string
  onChooseName: () => void
  onOpenDay: (dayIndex: number, half: 'am' | 'pm') => void
}

function hasProfileGift(name: string) {
  const value = name.trim().toLocaleLowerCase()
  return value.length === 3 && [112, 105, 112].every((code, index) => value.charCodeAt(index) === code)
}

export function MyWeek({ week, selectedName, onChooseName, onOpenDay }: MyWeekProps) {
  const [celebration, setCelebration] = useState<number | null>(null)

  useEffect(() => {
    if (celebration === null) return
    const timeout = window.setTimeout(() => setCelebration((current) => current === celebration ? null : current), 5500)
    return () => window.clearTimeout(timeout)
  }, [celebration])

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
  const hasGift = hasProfileGift(selectedName)
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
            {hasGift && (
              <button className="profile-gift" type="button" aria-label="Send some love" onClick={() => setCelebration(Date.now())}>
                <span aria-hidden="true">💗</span>
              </button>
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
      {celebration !== null && (
        <div className="celebration-layer" data-testid="profile-celebration" aria-hidden="true">
          {floaters.map((floater, index) => {
            const style: FloaterStyle = {
              '--float-left': `${floater.left}%`,
              '--float-drift': `${floater.drift}px`,
              '--float-sway': `${floater.sway}px`,
              '--float-delay': `${floater.delay}ms`,
              '--float-duration': `${floater.duration}ms`,
              '--float-size': `${floater.size}px`,
              '--float-rotate': `${floater.rotate}deg`,
            }
            return <span className="celebration-floater" style={style} key={`${celebration}-${index}`}>💗</span>
          })}
        </div>
      )}
    </section>
  )
}
