import { cookies } from 'next/headers'
import { createPlayer, getPlayer, getPlayerByName, restoreAp, savePlayer } from '@/lib/redis'

export async function GET() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('playerId')?.value
  if (!playerId) return Response.json({ player: null })

  const player = await getPlayer(playerId)
  if (!player) return Response.json({ player: null })

  const updated = restoreAp(player)
  if (updated.ap !== player.ap) await savePlayer(updated)

  return Response.json({ player: updated })
}

export async function POST(request: Request) {
  const { name } = await request.json()
  if (!name || name.trim().length < 1 || name.trim().length > 20) {
    return Response.json({ error: '名前は1〜20文字で入力してください' }, { status: 400 })
  }

  const existing = await getPlayerByName(name.trim())
  if (existing) {
    return Response.json({ error: 'その名前はすでに使われています' }, { status: 409 })
  }

  const player = await createPlayer(name.trim())

  const res = Response.json({ player })
  const cookieStore = await cookies()
  cookieStore.set('playerId', player.id, { httpOnly: true, maxAge: 60 * 60 * 24 * 365 })
  return res
}
