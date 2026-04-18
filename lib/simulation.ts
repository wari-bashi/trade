import type { GoodId, RaceId, CityExtState } from './types'
import { CITIES_MAP, CITIES, GOODS } from './gameData'

export const TICK_INTERVAL_MS = 60 * 1000
export const TARGET_STOCK = 200
export const MAX_STOCK = 800
export const MIN_PRICE_RATIO = 0.1
export const MAX_PRICE_RATIO = 6.0

// NPCフローが発生する価格差の閾値（15%以上で流れ始める）
const FLOW_THRESHOLD = 0.15
// 1ティックあたりの最大フロー量
const MAX_FLOW_PER_TICK = 60

const RACE_CONSUMPTION: Record<RaceId, Partial<Record<GoodId, number>>> = {
  nekomimi: { fish: 15, figure: 8, electronics: 5, mame: 3, bread: 2 },
  hato:     { mame: 20, hatoguruma: 5, ore: 3, fish: 2, weapons: 3 },
  bushi:    { rice: 12, imo: 10, shochu: 8, katana: 3, herb: 4 },
  yamazaki: { bread: 15, wheat: 8, snacks: 6, figure: 2 },
  natto:    { natto_food: 18, fermented: 10, daizu: 15, herb: 3 },
  ojisan:   { snacks: 15, shochu: 12, golf: 5, fish: 5, rice: 4 },
}

export function getInitialStocks(city: import('./types').City): Partial<Record<GoodId, number>> {
  const stocks: Partial<Record<GoodId, number>> = {}
  for (const good of GOODS) {
    const prodLevel = city.production[good.id as GoodId] ?? 0
    const demLevel = city.demand[good.id as GoodId] ?? 0
    if (prodLevel > 0) {
      stocks[good.id as GoodId] = TARGET_STOCK * prodLevel
    } else if (demLevel > 0) {
      stocks[good.id as GoodId] = Math.round(TARGET_STOCK * 0.4)
    } else {
      stocks[good.id as GoodId] = TARGET_STOCK
    }
  }
  return stocks
}

export function stockToPrice(basePrice: number, stock: number): number {
  const ratio = Math.pow(TARGET_STOCK / Math.max(stock, 5), 0.55)
  const clamped = Math.max(MIN_PRICE_RATIO, Math.min(MAX_PRICE_RATIO, ratio))
  return Math.max(1, Math.round(basePrice * clamped))
}

// 1都市分の生産・消費・繁栄度更新（NPC交易は別関数）
export function simulateCityProduction(state: CityExtState): CityExtState {
  const city = CITIES_MAP[state.cityId]
  if (!city) return state

  const stocks = { ...state.stocks } as Record<GoodId, number>
  const prosperity = state.prosperity
  const prosRatio = prosperity / 50

  // 1. 生産
  for (const [goodId, level] of Object.entries(city.production)) {
    const produced = Math.round(level * 12 * prosRatio)
    stocks[goodId as GoodId] = Math.min(MAX_STOCK, (stocks[goodId as GoodId] ?? 0) + produced)
  }

  // 2. 種族別消費
  const pop = state.population
  for (const [raceId, raceConsumption] of Object.entries(RACE_CONSUMPTION)) {
    const raceRatio = (pop[raceId as RaceId] ?? 0) / 100
    for (const [goodId, baseRate] of Object.entries(raceConsumption)) {
      const consumed = Math.round(baseRate * raceRatio * prosRatio)
      stocks[goodId as GoodId] = Math.max(0, (stocks[goodId as GoodId] ?? 0) - consumed)
    }
  }

  // 3. 繁栄度の更新
  let prosperityDelta = 0
  for (const [goodId, demLevel] of Object.entries(city.demand)) {
    const stock = stocks[goodId as GoodId] ?? 0
    if (stock < 30) {
      prosperityDelta -= demLevel * 1.5
    } else if (stock > TARGET_STOCK) {
      prosperityDelta += demLevel * 0.2
    }
  }
  for (const [goodId] of Object.entries(city.production)) {
    const stock = stocks[goodId as GoodId] ?? 0
    if (stock >= MAX_STOCK * 0.9) prosperityDelta -= 0.5
  }
  prosperityDelta += (city.baseProsperity - prosperity) * 0.05

  const newProsperity = Math.max(1, Math.min(100, prosperity + prosperityDelta))

  // 4. 人口・国籍の変動
  let population = { ...state.population }
  let nationId = state.nationId
  if (Math.random() < 0.1) {
    population = evolvePopulation(population, newProsperity, state.cityId)
    nationId = getDominantNation(population) ?? nationId
  }

  return {
    ...state,
    stocks,
    prosperity: newProsperity,
    population,
    nationId,
    lastTick: state.lastTick + TICK_INTERVAL_MS,
  }
}

// 全都市間のNPCフロー計算（価格差に応じて在庫が隣へ流れる）
export function simulateNPCFlows(
  allStates: Record<string, CityExtState>
): Record<string, CityExtState> {
  // 在庫を書き換えるので shallow copy
  const stocks: Record<string, Record<GoodId, number>> = {}
  for (const [id, state] of Object.entries(allStates)) {
    stocks[id] = { ...state.stocks } as Record<GoodId, number>
  }

  // 重複処理を避けるため処理済みペアを管理
  const processed = new Set<string>()

  for (const city of CITIES) {
    const stocksA = stocks[city.id]
    if (!stocksA) continue

    for (const route of city.routes) {
      const pairKey = [city.id, route.cityId].sort().join(':')
      if (processed.has(pairKey)) continue
      processed.add(pairKey)

      const stocksB = stocks[route.cityId]
      if (!stocksB) continue

      // 水路は流量1.5倍、APコストが低いルートほど活発
      const flowSpeed = (route.type === 'water' ? 1.5 : 1.0) / route.apCost

      for (const good of GOODS) {
        const qA = stocksA[good.id as GoodId] ?? 0
        const qB = stocksB[good.id as GoodId] ?? 0

        const priceA = stockToPrice(good.basePrice, qA)
        const priceB = stockToPrice(good.basePrice, qB)

        const diff = priceB - priceA
        const threshold = priceA * FLOW_THRESHOLD

        if (diff > threshold) {
          // A→B方向に流れる
          const flowAmount = Math.min(
            Math.round((diff / priceA) * 20 * flowSpeed),
            MAX_FLOW_PER_TICK,
            qA,
          )
          stocksA[good.id as GoodId] = qA - flowAmount
          stocksB[good.id as GoodId] = Math.min(MAX_STOCK, qB + flowAmount)
        } else if (-diff > threshold) {
          // B→A方向に流れる
          const flowAmount = Math.min(
            Math.round((-diff / priceB) * 20 * flowSpeed),
            MAX_FLOW_PER_TICK,
            qB,
          )
          stocksB[good.id as GoodId] = qB - flowAmount
          stocksA[good.id as GoodId] = Math.min(MAX_STOCK, qA + flowAmount)
        }
      }
    }
  }

  // 更新した在庫をstateに戻す
  const result: Record<string, CityExtState> = {}
  for (const [id, state] of Object.entries(allStates)) {
    result[id] = { ...state, stocks: stocks[id] ?? state.stocks }
  }
  return result
}

// 全都市に対してNティック分のシミュレーション（生産+NPC交易セット）
export function simulateAllTicks(
  allStates: Record<string, CityExtState>,
  ticks: number,
): Record<string, CityExtState> {
  let states = { ...allStates }
  for (let i = 0; i < ticks; i++) {
    // 各都市の生産・消費
    for (const id of Object.keys(states)) {
      states[id] = simulateCityProduction(states[id])
    }
    // NPC交易フロー
    states = simulateNPCFlows(states)
  }
  return states
}

function evolvePopulation(
  population: Record<RaceId, number>,
  prosperity: number,
  cityId: string,
): Record<RaceId, number> {
  const city = CITIES_MAP[cityId]
  const base = city.basePopulation
  const newPop = { ...population }
  const races = Object.keys(newPop) as RaceId[]
  const dominant = races.reduce((a, b) => newPop[a] > newPop[b] ? a : b)

  for (const race of races) {
    const diff = base[race] - newPop[race]
    const returnForce = diff * 0.02 * (prosperity / 50)
    const dominanceBonus = race === dominant ? 0.3 : -0.1
    newPop[race] = Math.max(0, newPop[race] + returnForce + dominanceBonus)
  }

  const total = Object.values(newPop).reduce((s, v) => s + v, 0)
  for (const race of races) {
    newPop[race] = Math.round((newPop[race] / total) * 100)
  }
  return newPop
}

function getDominantNation(population: Record<RaceId, number>): string | null {
  const raceToNation: Record<RaceId, string> = {
    nekomimi: 'nekomimi', hato: 'hato', bushi: 'satsuma',
    yamazaki: 'yamazaki', natto: 'natto', ojisan: 'ojisan',
  }
  for (const [race, ratio] of Object.entries(population)) {
    if (ratio >= 60) return raceToNation[race as RaceId]
  }
  return null
}

// 単一都市のlazyティック（生産・消費のみ、NPC交易なし）
export function applyMissedTicks(state: CityExtState, now: number): CityExtState {
  const elapsed = now - state.lastTick
  const ticks = Math.min(Math.floor(elapsed / TICK_INTERVAL_MS), 60)
  let current = state
  for (let i = 0; i < ticks; i++) {
    current = simulateCityProduction(current)
  }
  return current
}
