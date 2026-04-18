import type { Good, GoodId, City, Nation, RaceId } from './types'

export const NATIONS: Nation[] = [
  { id: 'nekomimi', name: 'ネコミミメイド人民共和大宇宙帝国', color: '#ff69b4' },
  { id: 'hato', name: '鳩族解放戦線', color: '#708090' },
  { id: 'satsuma', name: 'サツマ=ハン', color: '#8b4513' },
  { id: 'yamazaki', name: 'ヤマザキパン王国', color: '#ffd700' },
  { id: 'natto', name: '大納豆教聖王国', color: '#8b8000' },
  { id: 'ojisan', name: '全日本おじさん連合', color: '#2f4f4f' },
]

export const GOODS: Good[] = [
  // 食料
  { id: 'fish',        name: '魚',           category: 'food',       basePrice: 80,   weight: 2 },
  { id: 'imo',         name: '芋',           category: 'food',       basePrice: 40,   weight: 3 },
  { id: 'daizu',       name: '大豆',         category: 'food',       basePrice: 60,   weight: 2 },
  { id: 'wheat',       name: '小麦',         category: 'food',       basePrice: 50,   weight: 2 },
  { id: 'rice',        name: '米',           category: 'food',       basePrice: 70,   weight: 2 },
  { id: 'mame',        name: '豆',           category: 'food',       basePrice: 55,   weight: 1 },
  // 嗜好品
  { id: 'shochu',      name: '芋焼酎',       category: 'luxury',     basePrice: 200,  weight: 3 },
  { id: 'natto_food',  name: '納豆',         category: 'luxury',     basePrice: 120,  weight: 1 },
  { id: 'fermented',   name: '発酵食品',     category: 'luxury',     basePrice: 150,  weight: 2 },
  { id: 'bread',       name: 'パン',         category: 'luxury',     basePrice: 90,   weight: 1 },
  { id: 'snacks',      name: '酒のつまみ',   category: 'luxury',     basePrice: 130,  weight: 1 },
  // 工業品
  { id: 'ore',         name: '鉱石',         category: 'industrial', basePrice: 180,  weight: 5 },
  { id: 'electronics', name: '電子部品',     category: 'industrial', basePrice: 350,  weight: 1 },
  { id: 'weapons',     name: '武具素材',     category: 'industrial', basePrice: 280,  weight: 4 },
  // 文化品
  { id: 'figure',      name: 'フィギュア',   category: 'cultural',   basePrice: 400,  weight: 1 },
  { id: 'hatoguruma',  name: '鳩車',         category: 'cultural',   basePrice: 320,  weight: 3 },
  { id: 'katana',      name: 'カタナ',       category: 'cultural',   basePrice: 500,  weight: 2 },
  { id: 'golf',        name: 'ゴルフ用品',   category: 'cultural',   basePrice: 450,  weight: 3 },
  { id: 'kirakira',    name: 'キラキラ羽',   category: 'cultural',   basePrice: 380,  weight: 1 },
  // 珍品
  { id: 'fungi',       name: '菌関連製品',   category: 'rare',       basePrice: 600,  weight: 1 },
  { id: 'herb',        name: '薬草',         category: 'rare',       basePrice: 250,  weight: 1 },
  { id: 'jinmyaku',    name: '謎の人脈',     category: 'rare',       basePrice: 800,  weight: 1 },
]

export const GOODS_MAP = Object.fromEntries(GOODS.map(g => [g.id, g])) as Record<GoodId, Good>

export const CITIES: City[] = [
  // ネコミミメイド人民共和大宇宙帝国
  {
    id: 'akiba',
    name: 'アキバ',
    nationId: 'nekomimi',
    basePopulation: { nekomimi: 90, hato: 2, bushi: 1, yamazaki: 5, natto: 1, ojisan: 1 },
    production: { electronics: 3, figure: 3 },
    demand: { fish: 2, ore: 2 },
    routes: [
      { cityId: 'bukuro', type: 'land', apCost: 1 },
      { cityId: 'nyanko', type: 'water', apCost: 2 },
      { cityId: 'maid_lab', type: 'land', apCost: 2 },
    ],
  },
  {
    id: 'bukuro',
    name: 'ブクロ',
    nationId: 'nekomimi',
    basePopulation: { nekomimi: 85, hato: 3, bushi: 2, yamazaki: 7, natto: 1, ojisan: 2 },
    production: { figure: 3, bread: 1 },
    demand: { fish: 2, mame: 2 },
    routes: [
      { cityId: 'akiba', type: 'land', apCost: 1 },
      { cityId: 'nyan_farm', type: 'land', apCost: 2 },
      { cityId: 'yamazaki_city', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'nyanko',
    name: 'ニャンコー港',
    nationId: 'nekomimi',
    basePopulation: { nekomimi: 80, hato: 2, bushi: 5, yamazaki: 3, natto: 5, ojisan: 5 },
    production: { fish: 3 },
    demand: { ore: 2, electronics: 1 },
    routes: [
      { cityId: 'akiba', type: 'water', apCost: 2 },
      { cityId: 'dosukoi', type: 'water', apCost: 3 },
      { cityId: 'nioi', type: 'water', apCost: 3 },
    ],
  },
  {
    id: 'maid_lab',
    name: 'メイド科学省直轄研究区',
    nationId: 'nekomimi',
    basePopulation: { nekomimi: 95, hato: 1, bushi: 1, yamazaki: 2, natto: 1, ojisan: 0 },
    production: { electronics: 3, fungi: 1 },
    demand: { ore: 3, daizu: 2 },
    routes: [
      { cityId: 'akiba', type: 'land', apCost: 2 },
      { cityId: 'kukuku', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'nyan_farm',
    name: 'にゃんにゃん共同農場第七号',
    nationId: 'nekomimi',
    basePopulation: { nekomimi: 75, hato: 5, bushi: 8, yamazaki: 8, natto: 2, ojisan: 2 },
    production: { rice: 2, fish: 1 },
    demand: { figure: 2, shochu: 1 },
    routes: [
      { cityId: 'bukuro', type: 'land', apCost: 2 },
      { cityId: 'monsugoka', type: 'land', apCost: 2 },
    ],
  },

  // 鳩族解放戦線
  {
    id: 'hohohokkozen',
    name: 'ホーホーホッホーゼン',
    nationId: 'hato',
    basePopulation: { nekomimi: 3, hato: 88, bushi: 2, yamazaki: 3, natto: 2, ojisan: 2 },
    production: { hatoguruma: 3, weapons: 1 },
    demand: { mame: 3, fish: 2 },
    routes: [
      { cityId: 'kuruppobrug', type: 'land', apCost: 1 },
      { cityId: 'poppo_holy', type: 'land', apCost: 2 },
      { cityId: 'maid_lab', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'kuruppobrug',
    name: 'クルッポーブルグ',
    nationId: 'hato',
    basePopulation: { nekomimi: 2, hato: 90, bushi: 2, yamazaki: 3, natto: 1, ojisan: 2 },
    production: { kirakira: 3 },
    demand: { mame: 3, daizu: 2 },
    routes: [
      { cityId: 'hohohokkozen', type: 'land', apCost: 1 },
      { cityId: 'kukuku', type: 'land', apCost: 2 },
    ],
  },
  {
    id: 'poppo_holy',
    name: 'ポッポッポ革命聖地',
    nationId: 'hato',
    basePopulation: { nekomimi: 2, hato: 85, bushi: 3, yamazaki: 5, natto: 3, ojisan: 2 },
    production: { weapons: 2, ore: 1 },
    demand: { mame: 3, bread: 1 },
    routes: [
      { cityId: 'hohohokkozen', type: 'land', apCost: 2 },
      { cityId: 'popopo_fortress', type: 'land', apCost: 1 },
      { cityId: 'daily_hq', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'popopo_fortress',
    name: 'ポポポ同志の砦',
    nationId: 'hato',
    basePopulation: { nekomimi: 1, hato: 92, bushi: 3, yamazaki: 2, natto: 1, ojisan: 1 },
    production: { weapons: 3, ore: 1 },
    demand: { mame: 3, fish: 3 },
    routes: [
      { cityId: 'poppo_holy', type: 'land', apCost: 1 },
      { cityId: 'kukuku', type: 'land', apCost: 2 },
    ],
  },
  {
    id: 'kukuku',
    name: 'クックルックル採掘場',
    nationId: 'hato',
    basePopulation: { nekomimi: 2, hato: 85, bushi: 5, yamazaki: 3, natto: 2, ojisan: 3 },
    production: { ore: 3 },
    demand: { mame: 3, snacks: 2 },
    routes: [
      { cityId: 'kuruppobrug', type: 'land', apCost: 2 },
      { cityId: 'popopo_fortress', type: 'land', apCost: 2 },
      { cityId: 'zuba_castle', type: 'land', apCost: 3 },
    ],
  },

  // サツマ=ハン
  {
    id: 'dogonbo',
    name: '芋之極楽天国ドゴンボッ！！！！！！',
    nationId: 'satsuma',
    basePopulation: { nekomimi: 2, hato: 3, bushi: 88, yamazaki: 3, natto: 2, ojisan: 2 },
    production: { shochu: 3, imo: 2 },
    demand: { electronics: 2, fish: 2 },
    routes: [
      { cityId: 'zuba_castle', type: 'land', apCost: 1 },
      { cityId: 'monsugoka', type: 'land', apCost: 2 },
      { cityId: 'nurukabai', type: 'land', apCost: 2 },
    ],
  },
  {
    id: 'zuba_castle',
    name: 'ズバァッ！城下町',
    nationId: 'satsuma',
    basePopulation: { nekomimi: 2, hato: 5, bushi: 85, yamazaki: 3, natto: 2, ojisan: 3 },
    production: { katana: 3, weapons: 1 },
    demand: { rice: 2, ore: 2 },
    routes: [
      { cityId: 'dogonbo', type: 'land', apCost: 1 },
      { cityId: 'kukuku', type: 'land', apCost: 3 },
      { cityId: 'dosukoi', type: 'land', apCost: 2 },
    ],
  },
  {
    id: 'dosukoi',
    name: 'ドスコイ港ぬわー！',
    nationId: 'satsuma',
    basePopulation: { nekomimi: 5, hato: 3, bushi: 78, yamazaki: 5, natto: 5, ojisan: 4 },
    production: { fish: 2, herb: 1 },
    demand: { shochu: 2, katana: 1 },
    routes: [
      { cityId: 'zuba_castle', type: 'land', apCost: 2 },
      { cityId: 'nyanko', type: 'water', apCost: 3 },
      { cityId: 'nioi', type: 'water', apCost: 4 },
    ],
  },
  {
    id: 'nurukabai',
    name: 'ぬるかばい湯治場',
    nationId: 'satsuma',
    basePopulation: { nekomimi: 3, hato: 2, bushi: 85, yamazaki: 3, natto: 3, ojisan: 4 },
    production: { herb: 3 },
    demand: { rice: 2, snacks: 2 },
    routes: [
      { cityId: 'dogonbo', type: 'land', apCost: 2 },
      { cityId: 'monsugoka', type: 'land', apCost: 1 },
    ],
  },
  {
    id: 'monsugoka',
    name: 'もんすごか平原えいえい',
    nationId: 'satsuma',
    basePopulation: { nekomimi: 5, hato: 3, bushi: 80, yamazaki: 7, natto: 2, ojisan: 3 },
    production: { rice: 3, imo: 2 },
    demand: { katana: 1, electronics: 2 },
    routes: [
      { cityId: 'nurukabai', type: 'land', apCost: 1 },
      { cityId: 'dogonbo', type: 'land', apCost: 2 },
      { cityId: 'nyan_farm', type: 'land', apCost: 2 },
      { cityId: 'wheat_field', type: 'land', apCost: 3 },
    ],
  },

  // ヤマザキパン王国
  {
    id: 'yamazaki_city',
    name: 'パンの都ヤマザキ（7195181247代目聖地）',
    nationId: 'yamazaki',
    basePopulation: { nekomimi: 3, hato: 2, bushi: 2, yamazaki: 88, natto: 2, ojisan: 3 },
    production: { bread: 3, wheat: 1 },
    demand: { fish: 2, katana: 2 },
    routes: [
      { cityId: 'daily_hq', type: 'land', apCost: 1 },
      { cityId: 'bakery_zone', type: 'land', apCost: 1 },
      { cityId: 'bukuro', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'daily_hq',
    name: 'デイリーヤマザキ総本部なんかいろいろある建物',
    nationId: 'yamazaki',
    basePopulation: { nekomimi: 8, hato: 5, bushi: 5, yamazaki: 70, natto: 5, ojisan: 7 },
    production: { bread: 2, snacks: 1 },
    demand: { ore: 2, fish: 1 },
    routes: [
      { cityId: 'yamazaki_city', type: 'land', apCost: 1 },
      { cityId: 'wheat_field', type: 'land', apCost: 2 },
      { cityId: 'poppo_holy', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'wheat_field',
    name: 'どこまでも続く小麦畑',
    nationId: 'yamazaki',
    basePopulation: { nekomimi: 3, hato: 2, bushi: 5, yamazaki: 82, natto: 3, ojisan: 5 },
    production: { wheat: 3, daizu: 1 },
    demand: { katana: 1, electronics: 2 },
    routes: [
      { cityId: 'daily_hq', type: 'land', apCost: 2 },
      { cityId: 'monsugoka', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'bakery_zone',
    name: '24時間焼きっぱなし工場ゾーン',
    nationId: 'yamazaki',
    basePopulation: { nekomimi: 5, hato: 2, bushi: 3, yamazaki: 85, natto: 2, ojisan: 3 },
    production: { bread: 3 },
    demand: { wheat: 3, ore: 1 },
    routes: [
      { cityId: 'yamazaki_city', type: 'land', apCost: 1 },
      { cityId: 'seal_ground', type: 'land', apCost: 2 },
    ],
  },
  {
    id: 'seal_ground',
    name: 'シール交換所跡地',
    nationId: 'yamazaki',
    basePopulation: { nekomimi: 10, hato: 5, bushi: 5, yamazaki: 65, natto: 5, ojisan: 10 },
    production: { jinmyaku: 1 },
    demand: { bread: 2, snacks: 2 },
    routes: [
      { cityId: 'bakery_zone', type: 'land', apCost: 2 },
      { cityId: 'izakaya', type: 'land', apCost: 3 },
      { cityId: 'nioi', type: 'water', apCost: 3 },
    ],
  },

  // 大納豆教聖王国
  {
    id: 'ito_cathedral',
    name: '糸引き大聖堂',
    nationId: 'natto',
    basePopulation: { nekomimi: 2, hato: 2, bushi: 2, yamazaki: 2, natto: 90, ojisan: 2 },
    production: { natto_food: 3, fermented: 1 },
    demand: { daizu: 3, fish: 1 },
    routes: [
      { cityId: 'kusaya', type: 'land', apCost: 1 },
      { cityId: 'kinshi_factory', type: 'land', apCost: 2 },
      { cityId: 'nioi', type: 'water', apCost: 2 },
    ],
  },
  {
    id: 'kusaya',
    name: '発酵の里くさや',
    nationId: 'natto',
    basePopulation: { nekomimi: 1, hato: 2, bushi: 2, yamazaki: 2, natto: 92, ojisan: 1 },
    production: { fermented: 3, herb: 1 },
    demand: { daizu: 3, rice: 2 },
    routes: [
      { cityId: 'ito_cathedral', type: 'land', apCost: 1 },
      { cityId: 'daizu_farm', type: 'land', apCost: 2 },
    ],
  },
  {
    id: 'kinshi_factory',
    name: '菌糸工業団地',
    nationId: 'natto',
    basePopulation: { nekomimi: 3, hato: 3, bushi: 2, yamazaki: 3, natto: 88, ojisan: 1 },
    production: { fungi: 3, natto_food: 1 },
    demand: { daizu: 3, ore: 2 },
    routes: [
      { cityId: 'ito_cathedral', type: 'land', apCost: 2 },
      { cityId: 'daizu_farm', type: 'land', apCost: 1 },
    ],
  },
  {
    id: 'daizu_farm',
    name: '大豆畑だが足りない',
    nationId: 'natto',
    basePopulation: { nekomimi: 3, hato: 2, bushi: 2, yamazaki: 5, natto: 86, ojisan: 2 },
    production: { daizu: 2 },
    demand: { daizu: 3, fish: 2 },
    routes: [
      { cityId: 'kusaya', type: 'land', apCost: 2 },
      { cityId: 'kinshi_factory', type: 'land', apCost: 1 },
      { cityId: 'nioi', type: 'water', apCost: 2 },
    ],
  },
  {
    id: 'nioi',
    name: 'においの街ネバーネバー',
    nationId: 'natto',
    basePopulation: { nekomimi: 5, hato: 3, bushi: 3, yamazaki: 5, natto: 80, ojisan: 4 },
    production: { natto_food: 2, fermented: 2 },
    demand: { daizu: 3, electronics: 1 },
    routes: [
      { cityId: 'ito_cathedral', type: 'water', apCost: 2 },
      { cityId: 'daizu_farm', type: 'water', apCost: 2 },
      { cityId: 'nyanko', type: 'water', apCost: 3 },
      { cityId: 'dosukoi', type: 'water', apCost: 4 },
      { cityId: 'seal_ground', type: 'water', apCost: 3 },
    ],
  },

  // 全日本おじさん連合
  {
    id: 'izakaya',
    name: '居酒屋通り本町三丁目',
    nationId: 'ojisan',
    basePopulation: { nekomimi: 3, hato: 3, bushi: 5, yamazaki: 5, natto: 4, ojisan: 80 },
    production: { snacks: 3, shochu: 1 },
    demand: { fish: 3, rice: 2 },
    routes: [
      { cityId: 'golf_highland', type: 'land', apCost: 1 },
      { cityId: 'maama_center', type: 'land', apCost: 1 },
      { cityId: 'seal_ground', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'golf_highland',
    name: 'ゴルフ場しかない高原',
    nationId: 'ojisan',
    basePopulation: { nekomimi: 2, hato: 2, bushi: 3, yamazaki: 5, natto: 2, ojisan: 86 },
    production: { golf: 3 },
    demand: { snacks: 3, herb: 2 },
    routes: [
      { cityId: 'izakaya', type: 'land', apCost: 1 },
      { cityId: 'yakitori_cape', type: 'land', apCost: 2 },
    ],
  },
  {
    id: 'maama_center',
    name: 'まあまあ外交センター',
    nationId: 'ojisan',
    basePopulation: { nekomimi: 5, hato: 5, bushi: 5, yamazaki: 8, natto: 5, ojisan: 72 },
    production: { jinmyaku: 2 },
    demand: { snacks: 2, shochu: 3 },
    routes: [
      { cityId: 'izakaya', type: 'land', apCost: 1 },
      { cityId: 'teinen_town', type: 'land', apCost: 2 },
      { cityId: 'daily_hq', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'yakitori_cape',
    name: '焼き鳥と串カツの岬',
    nationId: 'ojisan',
    basePopulation: { nekomimi: 3, hato: 5, bushi: 5, yamazaki: 3, natto: 4, ojisan: 80 },
    production: { snacks: 3, fish: 1 },
    demand: { rice: 3, shochu: 2 },
    routes: [
      { cityId: 'golf_highland', type: 'land', apCost: 2 },
      { cityId: 'teinen_town', type: 'land', apCost: 1 },
      { cityId: 'nurukabai', type: 'land', apCost: 3 },
    ],
  },
  {
    id: 'teinen_town',
    name: '定年後の楽園ニュータウン',
    nationId: 'ojisan',
    basePopulation: { nekomimi: 2, hato: 2, bushi: 3, yamazaki: 5, natto: 3, ojisan: 85 },
    production: { jinmyaku: 2, golf: 1 },
    demand: { herb: 3, fermented: 2 },
    routes: [
      { cityId: 'maama_center', type: 'land', apCost: 2 },
      { cityId: 'yakitori_cape', type: 'land', apCost: 1 },
    ],
  },
]

export const CITIES_MAP = Object.fromEntries(CITIES.map(c => [c.id, c]))

export const NATIONS_MAP = Object.fromEntries(NATIONS.map(n => [n.id, n]))

export const AP_RESTORE_INTERVAL_MS = 6 * 1000
export const MAX_AP = 20
export const STARTING_GOLD = 1000
export const CARGO_CAPACITY = 100
export const STARTING_CITY = 'daily_hq'

export function calcPrice(
  basePrice: number,
  production: number,
  demand: number,
  stock: number,
): number {
  const supplyFactor = 1 - (production - 1) * 0.15
  const demandFactor = 1 + (demand - 1) * 0.15
  const stockFactor = stock > 0 ? Math.max(0.5, 1 - stock * 0.005) : 1.5
  return Math.max(1, Math.round(basePrice * supplyFactor * demandFactor * stockFactor))
}
