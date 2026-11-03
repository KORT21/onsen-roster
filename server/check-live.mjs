import { fetchRosterPayload } from './roster-core.mjs'

const payload = await fetchRosterPayload()
console.log(JSON.stringify({
  fetchedAt: payload.fetchedAt,
  source: payload.source.name,
  weeks: payload.weeks.map((week) => ({
    label: week.label,
    start: week.start,
    rows: week.rows.length,
    diagnostics: week.diagnostics,
  })),
}, null, 2))
