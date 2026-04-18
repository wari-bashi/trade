import { kv } from '@vercel/kv'
import type { Player, CityState, GoodId, RaceId } from './types'
import {
  CITIES_MAP,
  GOODS,
  GOODS_MAP,
  calcPrice,
  AP_RESTORE_INTERVAL_MS,
  MAX_AP,
} from './gameData'

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

export async function getCityState(cityId: string): Promise<CityState> {
  const city = CITIES_MAP[cityId]
  const stored = await kv.get<Partial<CityState>>(`city:${cityId}`)

  const population: Record<RaceId, number> =
    stored?.population ?? { ...city.basePopulation } as Record<RaceId, number>

  const nationId = stored?.nationId ?? city.nationId

  const prices: Partial<Record<GoodId, number>> = {}
  for (const good of GOODS) {
    const stock = (stored?.prices as any)?.[`stock_${good.id}`] ?? 0
    const prod = city.production[good.id as GoodId] ?? 0
    const dem = city.demand[good.id as GoodId] ?? 0
    prices[good.id as GoodId] = calcPrice(good.basePrice, prod, dem, stock)
  }

  return { cityId, prices, population, nationId }
}

export async function initCityStates(): Promise<void> {
  const { CITIES } = await import('./gameData')
  for (const city of CITIES) {
    const existing = await kv.get(`city:${city.id}`)
    if (!existing) {
      await kv.set(`city:${city.id}`, {
        cityId: city.id,
        prices: {},
        population: { ...city.basePopulation },
        nationId: city.nationId,
      })
    }
  }
}
