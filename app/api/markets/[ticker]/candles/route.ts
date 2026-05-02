import { dflow, handle } from '@/lib/proxy'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params
  const { searchParams } = new URL(req.url)

  const now = Math.floor(Date.now() / 1000)
  const startTs = Number(searchParams.get('startTs') ?? now - 24 * 3600)
  const endTs = Number(searchParams.get('endTs') ?? now)
  const periodInterval = searchParams.get('periodInterval') ?? '60'

  return handle(() =>
    dflow(`/market/${encodeURIComponent(ticker)}/candlesticks`, {
      startTs,
      endTs,
      periodInterval,
    }),
  )
}
