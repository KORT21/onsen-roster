import { describe, expect, it } from 'vitest'
import { relativeRosterAge, syncIndicator } from './syncStatus'

const now = new Date('2026-11-03T08:00:00.000Z').getTime()

describe('sync status', () => {
  it('hides the indicator for fresh live data', () => {
    expect(syncIndicator('live', '2026-11-03T07:30:00.000Z', true, now)).toBeNull()
  })

  it('reports cached and stale data in plain relative time', () => {
    expect(syncIndicator('cache', '2026-11-03T05:00:00.000Z', true, now)).toEqual({
      tone: 'warning',
      label: 'Last updated 3 hours ago',
    })
    expect(relativeRosterAge('2026-11-02T07:30:00.000Z', now)).toBe('Last updated yesterday')
  })

  it('prioritises the offline state', () => {
    expect(syncIndicator('live', '2026-11-03T07:59:00.000Z', false, now)).toEqual({
      tone: 'offline',
      label: 'Offline',
    })
  })
})
