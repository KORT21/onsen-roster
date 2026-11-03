import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { assignmentsFor, findSupervisorSplit, roleMeta, todayIso } from '../lib/roster'
import type { RosterWeek } from '../types/roster'

const heartParticles = [
  { dx: -128, dy: -250, rotate: -34, delay: 0, size: 18 },
  { dx: -70, dy: -338, rotate: 22, delay: 80, size: 14 },
  { dx: 18, dy: -290, rotate: -14, delay: 150, size: 22 },
  { dx: 104, dy: -230, rotate: 30, delay: 55, size: 16 },
  { dx: 188, dy: -142, rotate: 42, delay: 180, size: 19 },
  { dx: 202, dy: -30, rotate: -24, delay: 95, size: 13 },
  { dx: 164, dy: 112, rotate: 28, delay: 220, size: 20 },
  { dx: 80, dy: 224, rotate: -18, delay: 125, size: 15 },
  { dx: -12, dy: 270, rotate: 24, delay: 250, size: 21 },
  { dx: -104, dy: 210, rotate: -36, delay: 165, size: 14 },
  { dx: -154, dy: 106, rotate: 18, delay: 290, size: 18 },
  { dx: -136, dy: -34, rotate: -28, delay: 110, size: 13 },
  { dx: 68, dy: -102, rotate: 12, delay: 310, size: 12 },
  { dx: 24, dy: 104, rotate: -16, delay: 345, size: 16 },
] as const

type HeartParticleStyle = CSSProperties & {
  '--origin-x': string
  '--origin-y': string
  '--heart-dx': string
  '--heart-dy': string
  '--heart-rotate': string
  '--heart-delay': string
  '--heart-size': string
}

interface MyWeekProps {
  week: RosterWeek
  selectedName: string
  onChooseName: () => void
  onOpenDay: (dayIndex: number, half: 'am' | 'pm') => void
}

export function MyWeek({ week, selectedName, onChooseName, onOpenDay }: MyWeekProps) {
  const heartButton = useRef<HTMLButtonElement>(null)
  const [heartBurst, setHeartBurst] = useState<{ id: number; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!heartBurst) return
    const timeout = window.setTimeout(() => {
      setHeartBurst((current) => current?.id === heartBurst.id ? null : current)
    }, 2200)
    return () => window.clearTimeout(timeout)
  }, [heartBurst])

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

  const sendPipLove = () => {
    const rect = heartButton.current?.getBoundingClientRect()
    setHeartBurst({
      id: Date.now(),
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
    })
  }

  return (
    <section className="my-week-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Your week</span>
          <h2 className="my-week-name">
            {selectedName}
            {isPip && (
              <button ref={heartButton} className="pip-heart-button" type="button" aria-label="Send Pip some love" onClick={sendPipLove}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20.4S4 15.35 4 9.45A4.35 4.35 0 0 1 12 7a4.35 4.35 0 0 1 8 2.45c0 5.9-8 10.95-8 10.95Z" />
                </svg>
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
      {heartBurst && (
        <div className="pip-heart-burst" data-testid="pip-heart-burst" aria-hidden="true">
          {heartParticles.map((particle, index) => {
            const style: HeartParticleStyle = {
              '--origin-x': `${heartBurst.x}px`,
              '--origin-y': `${heartBurst.y}px`,
              '--heart-dx': `${particle.dx}px`,
              '--heart-dy': `${particle.dy}px`,
              '--heart-rotate': `${particle.rotate}deg`,
              '--heart-delay': `${particle.delay}ms`,
              '--heart-size': `${particle.size}px`,
            }
            return (
              <svg className={`pip-heart-particle tone-${index % 3}`} style={style} viewBox="0 0 24 24" key={`${heartBurst.id}-${index}`}>
                <path d="M12 20.4S4 15.35 4 9.45A4.35 4.35 0 0 1 12 7a4.35 4.35 0 0 1 8 2.45c0 5.9-8 10.95-8 10.95Z" />
              </svg>
            )
          })}
        </div>
      )}
    </section>
  )
}
