import { fetchRosterPayload } from '../server/roster-core.mjs'

export default async function handler(_request, response) {
  try {
    const payload = await fetchRosterPayload()
    response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=120, stale-while-revalidate=300')
    response.status(200).json(payload)
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : String(error) })
  }
}

