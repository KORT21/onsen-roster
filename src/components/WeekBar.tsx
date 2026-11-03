import type { RosterWeek } from '../types/roster'

interface WeekBarProps {
  weeks: RosterWeek[]
  index: number
  onChange: (next: number) => void
}

function weekRange(week: RosterWeek) {
  const first = new Date(`${week.days[0].date}T12:00:00Z`)
  const last = new Date(`${week.days[6].date}T12:00:00Z`)
  const format = (date: Date) => date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return `${format(first)} – ${format(last)}`
}

export function WeekBar({ weeks, index, onChange }: WeekBarProps) {
  const week = weeks[index]
  return (
    <div className="week-bar">
      <button aria-label="Previous week" disabled={index === 0} onClick={() => onChange(index - 1)}>‹</button>
      <div>
        <strong>{week.label}</strong>
        <span>{weekRange(week)}</span>
      </div>
      <button aria-label="Next week" disabled={index === weeks.length - 1} onClick={() => onChange(index + 1)}>›</button>
    </div>
  )
}
