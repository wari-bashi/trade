import { kv } from '@vercel/kv'
import { CITIES } from '@/lib/gameData'
import { simulateTick } from '@/lib/simulation'
import type { CityExtState } from '@/lib/types'

export async function POST(request: Request) {
  const { times = 10 } = await request.json().catch(() => ({}))
  const n = Math.min(Math.max(1, Number(times)), 100)

  const results: Record<string, { prosperity: number; nationId: string }> = {}

  for (const city of CITIES) {
    const stored = await kv.get<CityExtState>(`cityext:${city.id}`)
    if (!stored) continue

    let state = stored
    for (let i = 0; i < n; i++) {
      state = simulateTick(state)
    }
    await kv.set(`cityext:${city.id}`, state)
    results[city.id] = { prosperity: Math.round(state.prosperity), nationId: state.nationId }
  }

  return Response.json({ ticked: n, cities: results })
}
