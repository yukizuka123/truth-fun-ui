import { dflow, handle } from '@/lib/proxy'
import { isBinaryEvent, type DFlowEvent } from '@/lib/binary'

export async function GET() {
  return handle(async () => {
    const { events } = await dflow<{ events: DFlowEvent[] }>('/events', {
      withNestedMarkets: true,
      status: 'active',
      limit: 100,
    })

    const binary = events.filter(isBinaryEvent)

    const topActive = [...binary]
      .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0))
      .slice(0, 5)

    const recent = [...binary]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 5)

    return { topActive, recent }
  })
}
