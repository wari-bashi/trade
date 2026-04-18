import { kv } from '@vercel/kv'
import { CITIES } from '@/lib/gameData'
import { simulateAllTicks } from '@/lib/simulation'
import type { CityExtState } from '@/lib/types'

export async function POST(request: Request) {
  const { times = 10 } = await request.json().catch(() => ({}))
  const n = Math.min(Math.max(1, Number(times)), 100)

  // 全都市の状態を一括ロード
  const allStates: Record<string, CityExtState> = {}
  for (const city of CITIES) {
    const stored = await kv.get<CityExtState>(`cityext:${city.id}`)
    if (stored) allStates[city.id] = stored
  }

  // 生産+NPC交易をNティック分まとめて実行
  const updated = simulateAllTicks(allStates, n)

  // 全都市を一括保存
  await Promise.all(
    Object.values(updated).map(s => kv.set(`cityext:${s.cityId}`, s))
  )

  const summary = Object.fromEntries(
    Object.values(updated).map(s => [
      s.cityId,
      { prosperity: Math.round(s.prosperity), nation: s.nationId },
    ])
  )

  return Response.json({ ticked: n, cities: summary })
}
