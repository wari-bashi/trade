import { cookies } from 'next/headers'
import { getPlayer, restoreAp, savePlayer } from '@/lib/redis'
import { CITIES_MAP } from '@/lib/gameData'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('playerId')?.value
  if (!playerId) return Response.json({ error: '未ログイン' }, { status: 401 })

  const { targetCityId } = await request.json()
  if (!targetCityId) return Response.json({ error: '移動先を指定してください' }, { status: 400 })

  const player = restoreAp(await getPlayer(playerId) ?? (() => { throw new Error() })())
  const currentCity = CITIES_MAP[player.cityId]
  if (!currentCity) return Response.json({ error: '現在地が不明' }, { status: 400 })

  const route = currentCity.routes.find(r => r.cityId === targetCityId)
  if (!route) return Response.json({ error: 'その都市には移動できません' }, { status: 400 })

  if (player.ap < route.apCost) {
    return Response.json({ error: `APが足りません（必要: ${route.apCost}、現在: ${player.ap}）` }, { status: 400 })
  }

  player.ap -= route.apCost
  player.cityId = targetCityId
  await savePlayer(player)

  return Response.json({ player, movedTo: CITIES_MAP[targetCityId] })
}
