import { fetchRosterPayload } from '../../server/roster-core.mjs'

export async function handler() {
  try {
    const payload = await fetchRosterPayload()
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=300',
      },
      body: JSON.stringify(payload),
    }
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    }
  }
}

