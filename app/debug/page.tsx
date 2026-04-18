'use client'

import { useState } from 'react'

interface GoodReport {
  good: string
  stock: number
  price: number
  basePrice: number
  priceRatio: number
  produced: number
  consumed: number
  net: number
  flows: { to: string; amount: number }[]
  warn: string | null
}

interface CityReport {
  id: string
  name: string
  nation: string
  prosperity: number
  baseProsperity: number
  staleTicks: number
  goods: GoodReport[]
  warnings: string[]
}

interface DebugState {
  cities: CityReport[]
  totalWarnings: string[]
}

export default function DebugPage() {
  const [data, setData] = useState<DebugState | null>(null)
  const [loading, setLoading] = useState(false)
  const [ticking, setTicking] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'warn' | 'flow'>('all')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/debug/state')
    setData(await res.json())
    setLoading(false)
  }

  async function tick(n: number) {
    setTicking(true)
    await fetch('/api/debug/tick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ times: n }),
    })
    await load()
    setTicking(false)
  }

  const city = data?.cities.find(c => c.id === selectedCity)

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono text-xs p-2">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-red-500 font-bold">DEBUG CONSOLE</span>
        <button onClick={load} disabled={loading} className="border border-green-700 px-2 py-0.5 hover:bg-green-950 disabled:opacity-40">
          {loading ? '読込中...' : '状態取得'}
        </button>
        {[1, 10, 60].map(n => (
          <button key={n} onClick={() => tick(n)} disabled={ticking}
            className="border border-red-800 text-red-300 px-2 py-0.5 hover:bg-red-950 disabled:opacity-40">
            +{n}tick
          </button>
        ))}
        <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)}
          className="bg-black border border-green-700 text-green-300 px-1 py-0.5">
          <option value="all">全商品</option>
          <option value="warn">警告のみ</option>
          <option value="flow">フローあり</option>
        </select>
      </div>

      {data && (
        <>
          {/* 警告サマリ */}
          {data.totalWarnings.length > 0 && (
            <div className="border border-red-800 bg-red-950 p-2 mb-2">
              <span className="text-red-400 font-bold">警告 ({data.totalWarnings.length}件)</span>
              <div className="mt-1 grid grid-cols-2 gap-x-4">
                {data.totalWarnings.map((w, i) => (
                  <span key={i} className="text-red-300">{w}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
            {/* 都市一覧 */}
            <div className="border border-green-800 p-2">
              <p className="text-green-500 mb-1">都市一覧</p>
              {data.cities.map(c => (
                <button key={c.id} onClick={() => setSelectedCity(c.id)}
                  className={`w-full text-left p-1 mb-0.5 border ${selectedCity === c.id ? 'border-green-500 bg-green-950' : 'border-green-900 hover:bg-green-950'} ${c.warnings.length > 0 ? 'text-red-300' : ''}`}>
                  <div className="flex justify-between">
                    <span className="truncate">{c.name}</span>
                    {c.warnings.length > 0 && <span className="text-red-500 ml-1">⚠{c.warnings.length}</span>}
                  </div>
                  <div className="text-green-700">
                    繁栄:{c.prosperity}/{c.baseProsperity}
                    {c.staleTicks > 0 && <span className="text-yellow-700 ml-1">({c.staleTicks}tick遅延)</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* 都市詳細 */}
            <div className="lg:col-span-3 border border-green-800 p-2">
              {city ? (
                <>
                  <p className="text-green-400 font-bold mb-1">{city.name}</p>
                  <p className="text-green-700 mb-2">国:{city.nation} 繁栄:{city.prosperity}(基準:{city.baseProsperity})</p>
                  <table className="w-full">
                    <thead>
                      <tr className="text-green-600 border-b border-green-900">
                        <th className="text-left py-0.5">商品</th>
                        <th className="text-right">在庫</th>
                        <th className="text-right">価格</th>
                        <th className="text-right">基準</th>
                        <th className="text-right">倍率</th>
                        <th className="text-right">生産</th>
                        <th className="text-right">消費</th>
                        <th className="text-right">収支</th>
                        <th className="text-left pl-2">NPCフロー</th>
                      </tr>
                    </thead>
                    <tbody>
                      {city.goods
                        .filter(g => {
                          if (filter === 'warn') return g.warn !== null
                          if (filter === 'flow') return g.flows.length > 0
                          return true
                        })
                        .map(g => (
                          <tr key={g.good} className={`border-b border-green-900 ${g.warn ? 'bg-red-950' : ''}`}>
                            <td className="py-0.5">{g.good}</td>
                            <td className="text-right">{g.stock}</td>
                            <td className={`text-right ${g.warn === '暴騰' ? 'text-red-400' : g.warn === '暴落' ? 'text-cyan-400' : 'text-yellow-400'}`}>{g.price}</td>
                            <td className="text-right text-green-800">{g.basePrice}</td>
                            <td className={`text-right ${g.priceRatio > 2 ? 'text-red-400' : g.priceRatio < 0.5 ? 'text-cyan-400' : 'text-green-600'}`}>×{g.priceRatio}</td>
                            <td className="text-right text-green-500">{g.produced > 0 ? `+${g.produced}` : '-'}</td>
                            <td className="text-right text-orange-500">{g.consumed > 0 ? `-${g.consumed}` : '-'}</td>
                            <td className={`text-right ${g.net > 0 ? 'text-green-400' : g.net < 0 ? 'text-red-400' : 'text-green-800'}`}>
                              {g.net > 0 ? `+${g.net}` : g.net < 0 ? g.net : '0'}
                            </td>
                            <td className="pl-2 text-green-700">
                              {g.flows.map((f, i) => (
                                <span key={i} className={f.amount > 0 ? 'text-yellow-700' : 'text-cyan-800'}>
                                  {f.to}:{Math.abs(f.amount)}{i < g.flows.length - 1 ? ' ' : ''}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="text-green-800">← 都市を選択してください</p>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
