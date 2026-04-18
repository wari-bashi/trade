'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Player, Good, CityState } from '@/lib/types'
import type { City, Nation } from '@/lib/types'

interface RouteWithCity {
  cityId: string
  type: 'land' | 'water'
  apCost: number
  city: City
  nation: Nation
}

interface GameData {
  player: Player
  city: City
  cityState: CityState
  nation: Nation
  goods: Good[]
  routes: RouteWithCity[]
}

function priceLabel(price: number, base: number): { label: string; color: string } {
  const ratio = price / base
  if (ratio <= 0.5)  return { label: '激安!!', color: 'text-cyan-300' }
  if (ratio <= 0.8)  return { label: '安い',   color: 'text-green-400' }
  if (ratio <= 1.2)  return { label: '普通',   color: 'text-green-700' }
  if (ratio <= 1.6)  return { label: '高め',   color: 'text-yellow-500' }
  if (ratio <= 2.5)  return { label: '高騰',   color: 'text-orange-400' }
  return               { label: '暴騰!!',   color: 'text-red-400' }
}

function stockBar(stock: number, target = 200): string {
  const ratio = Math.min(stock / target, 2)
  const filled = Math.round(ratio * 5)
  return '█'.repeat(filled) + '░'.repeat(10 - Math.min(filled, 10))
}

function prosperityLabel(p: number): { label: string; color: string } {
  if (p >= 80) return { label: '繁栄', color: 'text-yellow-300' }
  if (p >= 60) return { label: '安定', color: 'text-green-400' }
  if (p >= 40) return { label: '普通', color: 'text-green-600' }
  if (p >= 20) return { label: '停滞', color: 'text-orange-400' }
  return               { label: '衰退', color: 'text-red-400' }
}

export default function GamePage() {
  const router = useRouter()
  const [data, setData] = useState<GameData | null>(null)
  const [message, setMessage] = useState('')
  const [tradeAmounts, setTradeAmounts] = useState<Record<string, number>>({})
  const [tick, setTick] = useState(0)
  const [debugTicking, setDebugTicking] = useState(false)
  const [debugMsg, setDebugMsg] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/city')
    if (res.status === 401) { router.push('/'); return }
    setData(await res.json())
  }, [router])

  useEffect(() => { load() }, [load])

  // 毎秒カウントアップ（AP表示更新 & 定期リロード）
  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => {
        if ((t + 1) % 10 === 0) load()  // 10秒ごとに自動リロード
        return t + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [load])

  async function debugTick(times: number) {
    setDebugTicking(true)
    setDebugMsg('')
    const res = await fetch('/api/debug/tick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ times }),
    })
    const json = await res.json()
    setDebugMsg(`${json.ticked}ティック完了`)
    await load()
    setDebugTicking(false)
  }

  async function move(targetCityId: string) {
    setMessage('')
    const res = await fetch('/api/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetCityId }),
    })
    const json = await res.json()
    if (!res.ok) { setMessage(json.error); return }
    setMessage(`▶ ${json.movedTo.name} へ移動した`)
    await load()
  }

  async function trade(action: 'buy' | 'sell', goodId: string) {
    const amount = tradeAmounts[goodId] ?? 1
    setMessage('')
    const res = await fetch('/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, goodId, amount }),
    })
    const json = await res.json()
    if (!res.ok) { setMessage(json.error); return }
    setMessage(`${action === 'buy' ? '◆ 購入' : '◇ 売却'} ×${amount} @ ${json.price}G = ${json.total}G`)
    await load()
  }

  if (!data) return (
    <main className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      読み込み中...
    </main>
  )

  const { player, city, cityState, nation, goods, routes } = data
  const cargoWeight = Object.entries(player.cargo).reduce((sum, [gid, qty]) => {
    const g = goods.find(x => x.id === gid)
    return sum + (g?.weight ?? 0) * (qty ?? 0)
  }, 0)

  const apIntervalMs = 6 * 1000
  const apNextSec = player.ap < player.maxAp
    ? Math.ceil((apIntervalMs - (Date.now() - player.lastApRestore) % apIntervalMs) / 1000)
    : 0

  const { label: prosLabel, color: prosColor } = prosperityLabel(cityState.prosperity)

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono text-sm p-2">
      {/* ステータスバー */}
      <div className="border border-green-700 p-2 mb-2 flex flex-wrap gap-4 items-center">
        <span className="text-yellow-400 font-bold">{player.name}</span>
        <span>所持金: <span className="text-yellow-300">{player.gold.toLocaleString()}G</span></span>
        <span>
          AP: <span className="text-cyan-400">{player.ap}/{player.maxAp}</span>
          {player.ap < player.maxAp && (
            <span className="text-green-700 ml-1 text-xs">(+1まで{apNextSec}秒)</span>
          )}
        </span>
        <span>積荷: <span className={cargoWeight >= player.cargoCapacity ? 'text-red-400' : 'text-orange-400'}>
          {cargoWeight}/{player.cargoCapacity}
        </span></span>
      </div>

      {/* 現在地 */}
      <div className="border border-green-700 p-2 mb-2 flex flex-wrap gap-3 items-center">
        <span className="text-green-600">現在地:</span>
        <span className="text-white font-bold">{city.name}</span>
        <span style={{ color: nation.color }} className="text-xs">▮ {nation.name}</span>
        <span className="text-green-700 text-xs">繁栄度: <span className={prosColor}>{Math.round(cityState.prosperity)} ({prosLabel})</span></span>
      </div>

      {message && (
        <div className="border border-yellow-700 bg-yellow-950 text-yellow-300 p-2 mb-2 text-xs">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* 商品リスト */}
        <div className="lg:col-span-2 border border-green-700 p-2">
          <p className="text-green-500 mb-2">― 市場 ―</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-green-600 border-b border-green-800">
                <th className="text-left py-1">商品</th>
                <th className="text-right">価格</th>
                <th className="text-right">基準</th>
                <th className="text-right w-14">相場</th>
                <th className="text-left w-24 pl-2">在庫</th>
                <th className="text-right">所持</th>
                <th className="text-right w-14">数量</th>
                <th className="text-center w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {goods.map(good => {
                const price = cityState.prices[good.id as keyof typeof cityState.prices] ?? good.basePrice
                const stock = cityState.stocks?.[good.id as keyof typeof cityState.stocks] ?? 0
                const owned = player.cargo[good.id as keyof typeof player.cargo] ?? 0
                const amount = tradeAmounts[good.id] ?? 1
                const { label, color } = priceLabel(price, good.basePrice)
                return (
                  <tr key={good.id} className="border-b border-green-900 hover:bg-green-950">
                    <td className="py-1">{good.name}</td>
                    <td className="text-right text-yellow-400 font-bold">{price}G</td>
                    <td className="text-right text-green-800">{good.basePrice}G</td>
                    <td className={`text-right ${color}`}>{label}</td>
                    <td className="pl-2">
                      <span className="text-green-900 text-xs font-mono">{stockBar(stock)}</span>
                    </td>
                    <td className="text-right text-orange-400">{owned > 0 ? owned : '-'}</td>
                    <td className="text-right">
                      <input
                        type="number"
                        min={1}
                        value={amount}
                        onChange={e => setTradeAmounts(prev => ({ ...prev, [good.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-12 bg-black border border-green-800 text-green-300 text-right px-1 focus:outline-none"
                      />
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => trade('buy', good.id)}
                        className="bg-green-900 border border-green-700 text-green-300 px-2 py-0.5 hover:bg-green-800 mr-1"
                      >買</button>
                      <button
                        onClick={() => trade('sell', good.id)}
                        disabled={owned === 0}
                        className="bg-red-950 border border-red-800 text-red-300 px-2 py-0.5 hover:bg-red-900 disabled:opacity-30"
                      >売</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 右パネル */}
        <div className="flex flex-col gap-2">
          {/* 移動先 */}
          <div className="border border-green-700 p-2">
            <p className="text-green-500 mb-2">― 移動先 ―</p>
            <div className="space-y-1">
              {routes.map(r => (
                <button
                  key={r.cityId}
                  onClick={() => move(r.cityId)}
                  disabled={player.ap < r.apCost}
                  className="w-full text-left border border-green-800 p-2 hover:bg-green-950 disabled:opacity-40 text-xs"
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-white">{r.city.name}</span>
                    <span className="text-yellow-600 ml-1 shrink-0">AP:{r.apCost}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: r.nation.color }} className="text-xs">▮ {r.nation.name}</span>
                    <span className={r.type === 'water' ? 'text-cyan-500' : 'text-green-600'}>
                      {r.type === 'water' ? '⛵ 水路' : '🚶 陸路'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 積荷 */}
          <div className="border border-green-700 p-2">
            <p className="text-green-500 mb-2">― 積荷 ―</p>
            {Object.keys(player.cargo).length === 0 ? (
              <p className="text-green-800 text-xs">なし</p>
            ) : (
              <div className="space-y-1 text-xs">
                {Object.entries(player.cargo).map(([gid, qty]) => {
                  const g = goods.find(x => x.id === gid)
                  return (
                    <div key={gid} className="flex justify-between">
                      <span>{g?.name ?? gid}</span>
                      <span className="text-orange-400">{qty}個 (重{(g?.weight ?? 0) * (qty ?? 0)})</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* デバッグパネル */}
      <div className="mt-2 border border-red-900 p-2 text-xs">
        <span className="text-red-600 mr-3">DEBUG</span>
        {[1, 10, 60].map(n => (
          <button
            key={n}
            onClick={() => debugTick(n)}
            disabled={debugTicking}
            className="bg-red-950 border border-red-800 text-red-300 px-2 py-0.5 mr-1 hover:bg-red-900 disabled:opacity-40"
          >
            +{n}ティック
          </button>
        ))}
        {debugMsg && <span className="text-red-400 ml-2">{debugMsg}</span>}
      </div>
    </main>
  )
}
