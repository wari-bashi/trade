export type RaceId = 'nekomimi' | 'hato' | 'bushi' | 'yamazaki' | 'natto' | 'ojisan'

export type GoodId =
  | 'fish' | 'imo' | 'daizu' | 'wheat' | 'rice' | 'mame'
  | 'shochu' | 'natto_food' | 'fermented' | 'bread' | 'snacks'
  | 'ore' | 'electronics' | 'weapons'
  | 'figure' | 'hatoguruma' | 'katana' | 'golf' | 'kirakira'
  | 'fungi' | 'herb' | 'jinmyaku'

export type RouteType = 'land' | 'water'

export interface Good {
  id: GoodId
  name: string
  category: 'food' | 'luxury' | 'industrial' | 'cultural' | 'rare'
  basePrice: number
  weight: number
}

export interface CityRoute {
  cityId: string
  type: RouteType
  apCost: number
}

export interface City {
  id: string
  name: string
  nationId: string
  basePopulation: Record<RaceId, number>
  production: Partial<Record<GoodId, number>>
  demand: Partial<Record<GoodId, number>>
  routes: CityRoute[]
}

export interface Nation {
  id: string
  name: string
  color: string
}

export interface Player {
  id: string
  name: string
  cityId: string
  gold: number
  ap: number
  maxAp: number
  lastApRestore: number
  cargo: Partial<Record<GoodId, number>>
  cargoCapacity: number
  createdAt: number
}

export interface CityState {
  cityId: string
  prices: Partial<Record<GoodId, number>>
  population: Record<RaceId, number>
  nationId: string
}
