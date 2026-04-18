'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TopPage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStart() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    router.push('/game')
  }

  async function handleResume() {
    setLoading(true)
    const res = await fetch('/api/player')
    const data = await res.json()
    if (data.player) {
      router.push('/game')
    } else {
      setError('セーブデータが見つかりません')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono flex flex-col items-center justify-center p-4">
      <div className="border border-green-600 p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2 text-yellow-400">
          ★ 混沌交易録 ★
        </h1>
        <p className="text-center text-green-600 text-sm mb-6">
          ネコミミ・鳩・ブシ・ヤマザキ・納豆・おじさんが織りなす交易世界
        </p>

        <div className="mb-6">
          <p className="text-sm mb-1 text-green-500">― 新規冒険者登録 ―</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="名前を入力"
              maxLength={20}
              className="flex-1 bg-black border border-green-600 text-green-300 px-2 py-1 text-sm focus:outline-none focus:border-green-400"
            />
            <button
              onClick={handleStart}
              disabled={loading || !name.trim()}
              className="bg-green-900 border border-green-600 text-green-300 px-4 py-1 text-sm hover:bg-green-800 disabled:opacity-50"
            >
              開始
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        <div className="border-t border-green-800 pt-4">
          <p className="text-sm mb-2 text-green-500">― 続きから ―</p>
          <button
            onClick={handleResume}
            disabled={loading}
            className="w-full bg-black border border-green-700 text-green-400 px-4 py-2 text-sm hover:bg-green-950 disabled:opacity-50"
          >
            セーブデータを読み込む
          </button>
        </div>

        <div className="mt-6 text-xs text-green-800 space-y-1">
          <p>・都市間を移動して商品を売買し、資産を増やせ</p>
          <p>・行動力（AP）は10分ごとに1回復する</p>
          <p>・他のプレイヤーの売買が価格に影響する</p>
        </div>
      </div>
    </main>
  )
}
