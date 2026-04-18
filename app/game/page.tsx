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
}

interface GameData {
  player: Player
  city: City
  cityState: CityState
  nation: Nation
  goods: Good[]
  routes: RouteWithCity[]
}

export default function GamePage() {
  const router = useRouter()
  const [data, setData] = useState<GameData | null>(null)
  const [message, setMessage] = useState('')
  const [tradeAmounts, setTradeAmounts] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    const res = await fetch('/api/city')
    if (res.status === 401) { router.push('/'); return }
    const json = await res.json()
    setData(json)
  }, [router])

  useEffect(() => { load() }, [load])

  async function move(targetCityId: string) {
    setMessage('')
    const res = await fetch('/api/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetCityId }),
    })
    const json = await res.json()
    if (!res.ok) { setMessage(json.error); return }
    setMessage(`${json.movedTo.name} へ移動した`)
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
    setMessage(`${action === 'buy' ? '購入' : '売却'} ${amount}個 @ ${json.price}G = ${json.total}G`)
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

  const apNextMs = (player.maxAp - player.ap > 0)
    ? 10 * 60 * 1000 - (Date.now() - player.lastApRestore) % (10 * 60 * 1000)
    : 0
  const apNextMin = Math.ceil(apNextMs / 60000)

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono text-sm p-2">
      {/* ステータスバー */}
      <div className="border border-green-700 p-2 mb-2 flex flex-wrap gap-4">
        <span className="text-yellow-400 font-bold">{player.name}</span>
        <span>所持金: <span className="text-yellow-300">{player.gold}G</span></span>
        <span>AP: <span className="text-cyan-400">{player.ap}/{player.maxAp}</span>
          {player.ap < player.maxAp && <span className="text-green-700 ml-1">(+1まで{apNextMin}分)</span>}
        </span>
        <span>積荷: <span className="text-orange-400">{cargoWeight}/{player.cargoCapacity}</span></span>
      </div>

      {/* 現在地 */}
      <div className="border border-green-700 p-2 mb-2">
        <span className="text-green-600">現在地: </span>
        <span className="text-white font-bold">{city.name}</span>
        <span className="ml-2 text-xs" style={{ color: nation.color }}>
          [{nation.name}]
        </span>
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
                <th className="text-right">所持</th>
                <th className="text-right w-16">数量</th>
                <th className="text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {goods.map(good => {
                const price = cityState.prices[good.id as keyof typeof cityState.prices] ?? good.basePrice
                const owned = player.cargo[good.id as keyof typeof player.cargo] ?? 0
                const amount = tradeAmounts[good.id] ?? 1
                return (
                  <tr key={good.id} className="border-b border-green-900 hover:bg-green-950">
                    <td className="py-1">{good.name}</td>
                    <td className="text-right text-yellow-400">{price}G</td>
                    <td className="text-right text-orange-400">{owned}</td>
                    <td className="text-right">
                      <input
                        type="number"
                        min={1}
                        value={amount}
                        onChange={e => setTradeAmounts(prev => ({ ...prev, [good.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-14 bg-black border border-green-800 text-green-300 text-right px-1 focus:outline-none"
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
                  className="w-full text-left border border-green-800 p-1 hover:bg-green-950 disabled:opacity-40 text-xs"
                >
                  <span className={r.type === 'water' ? 'text-cyan-400' : 'text-green-400'}>
                    {r.type === 'water' ? '⛵' : '🚶'}
                  </span>
                  <span className="ml-1">{r.city.name}</span>
                  <span className="float-right text-yellow-600">AP:{r.apCost}</span>
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
                      <span className="text-orange-400">{qty}個</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
