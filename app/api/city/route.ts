import { cookies } from 'next/headers'
import { getPlayer, getCityState, restoreAp, savePlayer } from '@/lib/redis'
import { CITIES_MAP, NATIONS_MAP, GOODS } from '@/lib/gameData'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('playerId')?.value
  if (!playerId) return Response.json({ error: '未ログイン' }, { status: 401 })

  const player = await getPlayer(playerId)
  if (!player) return Response.json({ error: 'プレイヤーが見つかりません' }, { status: 404 })

  const updated = restoreAp(player)
  if (updated.ap !== player.ap) await savePlayer(updated)

  const city = CITIES_MAP[updated.cityId]
  const cityState = await getCityState(updated.cityId)
  const nation = NATIONS_MAP[cityState.nationId]

  return Response.json({
    player: updated,
    city,
    cityState,
    nation,
    goods: GOODS,
    routes: city.routes.map(r => ({
      ...r,
      city: CITIES_MAP[r.cityId],
      nation: NATIONS_MAP[CITIES_MAP[r.cityId].nationId],
    })),
  })
}
