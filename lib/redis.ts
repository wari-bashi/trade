import { kv } from '@vercel/kv'
import type { Player, CityState, CityExtState, GoodId } from './types'
import { CITIES_MAP, GOODS, AP_RESTORE_INTERVAL_MS } from './gameData'
import { applyMissedTicks, getInitialStocks, stockToPrice } from './simulation'

export async function getPlayer(id: string): Promise<Player | null> {
  return kv.get<Player>(`player:${id}`)
}

export async function savePlayer(player: Player): Promise<void> {
  await kv.set(`player:${player.id}`, player)
}

export async function getPlayerByName(name: string): Promise<Player | null> {
  const id = await kv.get<string>(`name:${name}`)
  if (!id) return null
  return getPlayer(id)
}

export async function createPlayer(name: string): Promise<Player> {
  const { nanoid } = await import('nanoid')
  const id = nanoid(10)
  const now = Date.now()
  const player: Player = {
    id,
    name,
    cityId: 'daily_hq',
    gold: 1000,
    ap: 20,
    maxAp: 20,
    lastApRestore: now,
    cargo: {},
    cargoCapacity: 100,
    createdAt: now,
  }
  await kv.set(`player:${id}`, player)
  await kv.set(`name:${name}`, id)
  return player
}

export function restoreAp(player: Player): Player {
  const now = Date.now()
  const elapsed = now - player.lastApRestore
  const restored = Math.floor(elapsed / AP_RESTORE_INTERVAL_MS)
  if (restored <= 0) return player
  const newAp = Math.min(player.maxAp, player.ap + restored)
  return {
    ...player,
    ap: newAp,
    lastApRestore: player.lastApRestore + restored * AP_RESTORE_INTERVAL_MS,
  }
}

// 都市の拡張状態を取得（なければ初期化）
export async function getCityExtState(cityId: string): Promise<CityExtState> {
  const city = CITIES_MAP[cityId]
  const stored = await kv.get<CityExtState>(`cityext:${cityId}`)

  if (stored) {
    // lazyティック処理
    const updated = applyMissedTicks(stored, Date.now())
    if (updated.lastTick !== stored.lastTick) {
      await kv.set(`cityext:${cityId}`, updated)
    }
    return updated
  }

  // 初期化
  const initial: CityExtState = {
    cityId,
    nationId: city.nationId,
    population: { ...city.basePopulation },
    prosperity: 50,
    stocks: getInitialStocks(city),
    lastTick: Date.now(),
  }
  await kv.set(`cityext:${cityId}`, initial)
  return initial
}

export async function saveCityExtState(state: CityExtState): Promise<void> {
  await kv.set(`cityext:${state.cityId}`, state)
}

// CityState（API返却用）を構築
export async function getCityState(cityId: string): Promise<CityState> {
  const extState = await getCityExtState(cityId)
  const prices: Partial<Record<GoodId, number>> = {}

  for (const good of GOODS) {
    const stock = extState.stocks[good.id as GoodId] ?? 0
    prices[good.id as GoodId] = stockToPrice(good.basePrice, stock)
  }

  return {
    cityId,
    prices,
    population: extState.population,
    nationId: extState.nationId,
    prosperity: extState.prosperity,
    stocks: extState.stocks,
  }
}

// 売買時に在庫を直接更新
export async function updateCityStock(
  cityId: string,
  goodId: GoodId,
  delta: number,
): Promise<void> {
  const ext = await getCityExtState(cityId)
  const current = ext.stocks[goodId] ?? 0
  const updated: CityExtState = {
    ...ext,
    stocks: {
      ...ext.stocks,
      [goodId]: Math.max(0, current + delta),
    },
  }
  await saveCityExtState(updated)
}
