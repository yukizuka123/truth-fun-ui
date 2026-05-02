import { dflow, handle } from '@/lib/proxy'
import { isBinaryEvent, type DFlowEvent } from '@/lib/binary'

const PAGE_SIZE = 20
// Binary events are ~8% of DFlow active events; overfetch 5× to get ~8 binary per page
const OVERFETCH = 5

export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url)
    const cursor = Number(searchParams.get('cursor') ?? 0)
    const status = searchParams.get('status') ?? 'active'
    const category = searchParams.get('category') ?? undefined
    const seriesTickers = searchParams.get('seriesTickers') ?? undefined

    const sort = searchParams.get('sort') ?? undefined

    const { events } = await dflow<{ events: DFlowEvent[] }>('/events', {
      withNestedMarkets: true,
      // 'all' means no status filter — DFlow has no 'all' value
      ...(status !== 'all' ? { status } : {}),
      limit: PAGE_SIZE * OVERFETCH,
      offset: cursor,
      category,
      seriesTickers,
      sort,
    })

    const binary = events.filter(isBinaryEvent).slice(0, PAGE_SIZE)
    const upstreamWasFull = events.length === PAGE_SIZE * OVERFETCH

    return {
      items: binary,
      nextCursor: upstreamWasFull ? cursor + PAGE_SIZE * OVERFETCH : null,
    }
  })
}
