import { dflow, handle } from '@/lib/proxy'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params
  return handle(() => dflow(`/market/${encodeURIComponent(ticker)}`))
}
