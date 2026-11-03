export type RosterMode = 'live' | 'cache' | 'demo'

export interface SyncIndicator {
  tone: 'warning' | 'offline'
  label: string
}

const STALE_AFTER_MS = 2 * 60 * 60 * 1000

export function relativeRosterAge(fetchedAt: string, now = Date.now()) {
  const fetched = new Date(fetchedAt)
  const elapsed = Math.max(0, now - fetched.getTime())
  const minutes = Math.floor(elapsed / 60_000)

  if (minutes < 1) return 'Last updated just now'
  if (minutes < 60) return `Last updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Last updated ${hours} hour${hours === 1 ? '' : 's'} ago`
  if (hours < 48) return 'Last updated yesterday'

  return `Last updated ${fetched.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}`
}

export function syncIndicator(mode: RosterMode, fetchedAt: string, isOnline: boolean, now = Date.now()): SyncIndicator | null {
  if (!isOnline) return { tone: 'offline', label: 'Offline' }
  if (mode === 'demo') return { tone: 'warning', label: 'Unable to sync' }

  const age = Math.max(0, now - new Date(fetchedAt).getTime())
  if (mode === 'cache' || age > STALE_AFTER_MS) {
    return { tone: 'warning', label: relativeRosterAge(fetchedAt, now) }
  }

  return null
}
