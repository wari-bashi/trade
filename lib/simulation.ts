import type { GoodId, RaceId, CityExtState } from './types'
import { CITIES_MAP, GOODS, GOODS_MAP } from './gameData'

export const TICK_INTERVAL_MS = 60 * 1000   // 1分
export const TARGET_STOCK = 200             // 目標在庫（これを基準に価格計算）
export const MAX_STOCK = 800
export const MIN_PRICE_RATIO = 0.1
export const MAX_PRICE_RATIO = 6.0

// 種族ごとの消費傾向（prosperity=50のときの1ティックあたりの消費量係数）
const RACE_CONSUMPTION: Record<RaceId, Partial<Record<GoodId, number>>> = {
  nekomimi: { fish: 15, figure: 8, electronics: 5, mame: 3, bread: 2 },
  hato:     { mame: 20, hatoguruma: 5, ore: 3, fish: 2, weapons: 3 },
  bushi:    { rice: 12, imo: 10, shochu: 8, katana: 3, herb: 4 },
  yamazaki: { bread: 15, wheat: 8, snacks: 6, figure: 2 },
  natto:    { natto_food: 18, fermented: 10, daizu: 15, herb: 3 },
  ojisan:   { snacks: 15, shochu: 12, golf: 5, fish: 5, rice: 4 },
}

// 都市の初期在庫を計算
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

// 在庫から価格を計算
export function stockToPrice(basePrice: number, stock: number): number {
  const ratio = Math.pow(TARGET_STOCK / Math.max(stock, 5), 0.55)
  const clamped = Math.max(MIN_PRICE_RATIO, Math.min(MAX_PRICE_RATIO, ratio))
  return Math.max(1, Math.round(basePrice * clamped))
}

// 1ティック分のシミュレーション
export function simulateTick(state: CityExtState): CityExtState {
  const city = CITIES_MAP[state.cityId]
  if (!city) return state

  const stocks = { ...state.stocks } as Record<GoodId, number>
  const prosperity = state.prosperity
  const prosRatio = prosperity / 50  // 50が基準

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

  // 3. NPC自動交易（在庫の目標値への引力）
  // 接続ルート数が多いほど交易が活発 → 収束が速い
  const routeCount = city.routes.length
  const gravityStrength = 0.06 * (routeCount / 4)
  for (const good of GOODS) {
    const current = stocks[good.id as GoodId] ?? 0
    const gap = TARGET_STOCK - current
    const correction = Math.round(gap * gravityStrength)
    stocks[good.id as GoodId] = Math.max(0, Math.min(MAX_STOCK, current + correction))
  }

  // 4. 繁栄度の更新
  let prosperityDelta = 0
  // 需要品の在庫不足はペナルティ
  for (const [goodId, demLevel] of Object.entries(city.demand)) {
    const stock = stocks[goodId as GoodId] ?? 0
    if (stock < 30) {
      prosperityDelta -= demLevel * 1.5
    } else if (stock > TARGET_STOCK) {
      prosperityDelta += demLevel * 0.2
    }
  }
  // 生産品の在庫過多は繁栄を少し下げる（売れ残り）
  for (const [goodId] of Object.entries(city.production)) {
    const stock = stocks[goodId as GoodId] ?? 0
    if (stock >= MAX_STOCK * 0.9) prosperityDelta -= 0.5
  }
  // 基本的な安定加点
  prosperityDelta += 0.3

  const newProsperity = Math.max(1, Math.min(100, prosperity + prosperityDelta))

  // 5. 人口・国籍の変動（10ティックに1回程度の速さで）
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

// 繁栄度に応じて人口比率をゆっくり変化させる
function evolvePopulation(
  population: Record<RaceId, number>,
  prosperity: number,
  cityId: string,
): Record<RaceId, number> {
  const city = CITIES_MAP[cityId]
  const base = city.basePopulation
  const newPop = { ...population }

  // 繁栄が高いと基本人口構成に近づく、低いと大きい種族がさらに増える（同族ボーナス）
  const races = Object.keys(newPop) as RaceId[]
  const dominant = races.reduce((a, b) => newPop[a] > newPop[b] ? a : b)

  for (const race of races) {
    const diff = base[race] - newPop[race]
    // 繁栄が高い→基本値に戻る力が働く（移住・発展）
    const returnForce = diff * 0.02 * (prosperity / 50)
    // 支配種族はさらに少し増える傾向
    const dominanceBonus = race === dominant ? 0.3 : -0.1
    newPop[race] = Math.max(0, newPop[race] + returnForce + dominanceBonus)
  }

  // 合計を100に正規化
  const total = Object.values(newPop).reduce((s, v) => s + v, 0)
  for (const race of races) {
    newPop[race] = Math.round((newPop[race] / total) * 100)
  }

  return newPop
}

// 人口比率から支配国を決定（60%超で国籍変更）
function getDominantNation(population: Record<RaceId, number>): string | null {
  const raceToNation: Record<RaceId, string> = {
    nekomimi: 'nekomimi',
    hato: 'hato',
    bushi: 'satsuma',
    yamazaki: 'yamazaki',
    natto: 'natto',
    ojisan: 'ojisan',
  }
  for (const [race, ratio] of Object.entries(population)) {
    if (ratio >= 60) return raceToNation[race as RaceId]
  }
  return null
}

// lazyティック処理：最後のティックから経過した分だけシミュレーション
export function applyMissedTicks(state: CityExtState, now: number): CityExtState {
  const elapsed = now - state.lastTick
  const ticks = Math.min(Math.floor(elapsed / TICK_INTERVAL_MS), 60) // 最大60ティック一気に処理
  let current = state
  for (let i = 0; i < ticks; i++) {
    current = simulateTick(current)
  }
  return current
}
