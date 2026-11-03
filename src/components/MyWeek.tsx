import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { assignmentsFor, findSupervisorSplit, roleMeta, todayIso } from '../lib/roster'
import type { RosterWeek } from '../types/roster'

const floaters = [
  { left: 10, drift: 30, sway: -13, delay: 0, duration: 3000, size: 27, rotate: -14 },
  { left: 47, drift: -22, sway: 18, delay: 65, duration: 3900, size: 39, rotate: 12 },
  { left: 76, drift: 34, sway: -15, delay: 130, duration: 3350, size: 22, rotate: -8 },
  { left: 25, drift: -28, sway: 22, delay: 200, duration: 4300, size: 32, rotate: 15 },
  { left: 61, drift: 25, sway: -21, delay: 270, duration: 3200, size: 44, rotate: -10 },
  { left: 86, drift: -20, sway: 16, delay: 340, duration: 3800, size: 25, rotate: 9 },
  { left: 16, drift: 33, sway: -18, delay: 410, duration: 4550, size: 35, rotate: -16 },
  { left: 54, drift: -36, sway: 24, delay: 480, duration: 2900, size: 29, rotate: 13 },
  { left: 80, drift: 27, sway: -16, delay: 550, duration: 4100, size: 41, rotate: -11 },
  { left: 35, drift: -27, sway: 19, delay: 620, duration: 3450, size: 23, rotate: 14 },
  { left: 67, drift: -32, sway: 14, delay: 690, duration: 4400, size: 31, rotate: -12 },
  { left: 8, drift: 31, sway: -22, delay: 760, duration: 3100, size: 20, rotate: 8 },
  { left: 43, drift: -24, sway: 20, delay: 830, duration: 4000, size: 28, rotate: -14 },
  { left: 73, drift: 29, sway: -16, delay: 900, duration: 3300, size: 21, rotate: 11 },
  { left: 90, drift: -25, sway: 17, delay: 970, duration: 4600, size: 34, rotate: -10 },
  { left: 20, drift: 35, sway: -19, delay: 1040, duration: 3600, size: 25, rotate: 13 },
  { left: 58, drift: -30, sway: 21, delay: 1110, duration: 3050, size: 37, rotate: -15 },
  { left: 82, drift: 24, sway: -14, delay: 1180, duration: 4200, size: 19, rotate: 9 },
  { left: 31, drift: -26, sway: 18, delay: 1250, duration: 3500, size: 30, rotate: -12 },
  { left: 70, drift: 32, sway: -20, delay: 1320, duration: 4500, size: 24, rotate: 14 },
  { left: 12, drift: -18, sway: 15, delay: 1390, duration: 3150, size: 36, rotate: -9 },
  { left: 49, drift: 28, sway: -17, delay: 1460, duration: 3850, size: 22, rotate: 12 },
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
    const timeout = window.setTimeout(() => setCelebration((current) => current === celebration ? null : current), 6400)
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
                <span aria-hidden="true">💖</span>
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
