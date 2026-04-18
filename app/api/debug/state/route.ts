import { kv } from '@vercel/kv'
import { CITIES, GOODS, GOODS_MAP } from '@/lib/gameData'
import { stockToPrice, TARGET_STOCK, TICK_INTERVAL_MS, simulateNPCFlows } from '@/lib/simulation'
import type { CityExtState, GoodId, RaceId } from '@/lib/types'

const RACE_CONSUMPTION: Record<RaceId, Partial<Record<GoodId, number>>> = {
  nekomimi: { fish: 15, figure: 8, electronics: 5, mame: 3, bread: 2 },
  hato:     { mame: 20, hatoguruma: 5, ore: 3, fish: 2, weapons: 3 },
  bushi:    { rice: 12, imo: 10, shochu: 8, katana: 3, herb: 4 },
  yamazaki: { bread: 15, wheat: 8, snacks: 6, figure: 2 },
  natto:    { natto_food: 18, fermented: 10, daizu: 15, herb: 3 },
  ojisan:   { snacks: 15, shochu: 12, golf: 5, fish: 5, rice: 4 },
}

export async function GET() {
  const allStates: Record<string, CityExtState> = {}
  for (const city of CITIES) {
    const stored = await kv.get<CityExtState>(`cityext:${city.id}`)
    if (stored) allStates[city.id] = stored
  }

  const cityReports = []

  for (const city of CITIES) {
    const state = allStates[city.id]
    if (!state) continue

    const prosRatio = state.prosperity / 50
    const goodReports = []

    for (const good of GOODS) {
      const stock = (state.stocks[good.id as GoodId] ?? 0)
      const price = stockToPrice(good.basePrice, stock)
      const priceRatio = price / good.basePrice

      // 生産量
      const prodLevel = city.production[good.id as GoodId] ?? 0
      const produced = prodLevel > 0 ? Math.round(prodLevel * 12 * prosRatio) : 0

      // 消費量（全種族合計）
      let consumed = 0
      for (const [raceId, raceConsumption] of Object.entries(RACE_CONSUMPTION)) {
        const rate = raceConsumption[good.id as GoodId] ?? 0
        if (rate > 0) {
          const raceRatio = (state.population[raceId as RaceId] ?? 0) / 100
          consumed += Math.round(rate * raceRatio * prosRatio)
        }
      }

      const net = produced - consumed

      // 隣接都市とのNPCフロー予測
      const flows: { to: string; amount: number }[] = []
      for (const route of city.routes) {
        const neighborState = allStates[route.cityId]
        if (!neighborState) continue
        const neighborStock = neighborState.stocks[good.id as GoodId] ?? 0
        const neighborPrice = stockToPrice(good.basePrice, neighborStock)
        const diff = neighborPrice - price
        const threshold = price * 0.15
        if (Math.abs(diff) > threshold) {
          const flowSpeed = (route.type === 'water' ? 1.5 : 1.0) / route.apCost
          const amount = Math.min(
            Math.round((Math.abs(diff) / Math.min(price, neighborPrice)) * 20 * flowSpeed),
            60,
          )
          flows.push({
            to: diff > 0 ? `→${route.cityId}` : `←${route.cityId}`,
            amount: diff > 0 ? amount : -amount,
          })
        }
      }

      const staleness = Math.floor((Date.now() - state.lastTick) / TICK_INTERVAL_MS)

      goodReports.push({
        good: good.name,
        stock,
        price,
        basePrice: good.basePrice,
        priceRatio: Math.round(priceRatio * 100) / 100,
        produced,
        consumed,
        net,
        flows,
        warn: priceRatio > 2.5 ? '暴騰' : priceRatio < 0.4 ? '暴落' : null,
      })
    }

    cityReports.push({
      id: city.id,
      name: city.name,
      nation: state.nationId,
      prosperity: Math.round(state.prosperity),
      baseProsperity: city.baseProsperity,
      staleTicks: Math.floor((Date.now() - state.lastTick) / TICK_INTERVAL_MS),
      goods: goodReports,
      warnings: goodReports.filter(g => g.warn).map(g => `${g.good}: ${g.warn} (×${g.priceRatio})`),
    })
  }

  const totalWarnings = cityReports.flatMap(c => c.warnings)

  return Response.json({ cities: cityReports, totalWarnings })
}
