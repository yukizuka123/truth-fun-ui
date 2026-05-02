import { dflow, handle } from '@/lib/proxy'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params
  const { searchParams } = new URL(req.url)

  return handle(() =>
    dflow(`/onchain-trades/by-market/${encodeURIComponent(ticker)}`, {
      limit: searchParams.get('limit') ?? 50,
      cursor: searchParams.get('cursor') ?? undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
  )
}
