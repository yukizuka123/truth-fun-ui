import { dflow, handle } from '@/lib/proxy'
import { isBinaryEvent, type DFlowEvent } from '@/lib/binary'

export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get('q')?.trim()
    if (!q || q.length < 2) return { events: [], markets: [] }

    const data = await dflow<{ events?: DFlowEvent[]; markets?: unknown[] }>('/search', {
      q,
      withNestedMarkets: true,
    })

    return {
      events: (data.events ?? []).filter(isBinaryEvent),
      markets: data.markets ?? [],
    }
  })
}
