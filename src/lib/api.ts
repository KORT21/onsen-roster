import { demoPayload } from '../data/demo'
import type { RosterPayload } from '../types/roster'
import { isRosterPayload } from './roster'

const CACHE_KEY = 'onsen_roster_cache_v1'

export interface LoadedRoster {
  payload: RosterPayload
  mode: 'live' | 'cache' | 'demo'
  error?: string
}

function cachedPayload(): RosterPayload | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
    return isRosterPayload(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function loadRoster(signal?: AbortSignal): Promise<LoadedRoster> {
  const configured = import.meta.env.VITE_ROSTER_API_URL?.trim()
  if (configured === 'demo') return { payload: demoPayload, mode: 'demo' }
  const endpoint = configured || '/api/roster'

  try {
    const url = new URL(endpoint, window.location.origin)
    url.searchParams.set('_', String(Date.now()))
    const response = await fetch(url, { cache: 'no-store', signal })
    if (!response.ok) throw new Error(`Roster service returned ${response.status}`)
    const data: unknown = await response.json()
    if (!isRosterPayload(data)) throw new Error('Roster service returned an unexpected format')
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    return { payload: data, mode: 'live' }
  } catch (error) {
    if (signal?.aborted) throw error
    const cached = cachedPayload()
    const message = error instanceof Error ? error.message : 'Could not load the roster'
    if (cached) return { payload: cached, mode: 'cache', error: message }
    return { payload: demoPayload, mode: 'demo', error: message }
  }
}
