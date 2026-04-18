import { cookies } from 'next/headers'
import { getPlayer, getCityState, restoreAp, savePlayer } from '@/lib/redis'
import { kv } from '@vercel/kv'
import { GOODS_MAP } from '@/lib/gameData'
import type { GoodId } from '@/lib/types'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('playerId')?.value
  if (!playerId) return Response.json({ error: '未ログイン' }, { status: 401 })

  const { action, goodId, amount } = await request.json() as {
    action: 'buy' | 'sell'
    goodId: GoodId
    amount: number
  }

  if (!['buy', 'sell'].includes(action) || !goodId || amount < 1) {
    return Response.json({ error: '不正なリクエスト' }, { status: 400 })
  }

  const player = restoreAp(await getPlayer(playerId) ?? (() => { throw new Error() })())
  const good = GOODS_MAP[goodId]
  if (!good) return Response.json({ error: '存在しない商品' }, { status: 400 })

  const cityState = await getCityState(player.cityId)
  const price = cityState.prices[goodId] ?? good.basePrice

  if (action === 'buy') {
    const totalCost = price * amount
    const totalWeight = good.weight * amount
    const currentWeight = Object.entries(player.cargo).reduce((sum, [gid, qty]) => {
      return sum + (GOODS_MAP[gid as GoodId]?.weight ?? 0) * (qty ?? 0)
    }, 0)

    if (player.gold < totalCost) {
      return Response.json({ error: '所持金が足りません' }, { status: 400 })
    }
    if (currentWeight + totalWeight > player.cargoCapacity) {
      return Response.json({ error: '積荷容量が足りません' }, { status: 400 })
    }

    player.gold -= totalCost
    player.cargo[goodId] = (player.cargo[goodId] ?? 0) + amount

    await kv.hincrby(`city:${player.cityId}:stock`, goodId, -amount)
  } else {
    const owned = player.cargo[goodId] ?? 0
    if (owned < amount) {
      return Response.json({ error: 'その商品を持っていません' }, { status: 400 })
    }

    const totalGain = price * amount
    player.gold += totalGain
    player.cargo[goodId] = owned - amount
    if (player.cargo[goodId] === 0) delete player.cargo[goodId]

    await kv.hincrby(`city:${player.cityId}:stock`, goodId, amount)
  }

  await savePlayer(player)
  return Response.json({ player, price, total: price * amount })
}
