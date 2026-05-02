import { dflow, handle } from '@/lib/proxy'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params
  // DFlow uses singular /event/{ticker}, not /events/{ticker}
  return handle(() =>
    dflow(`/event/${encodeURIComponent(ticker)}`, { withNestedMarkets: true }),
  )
}
