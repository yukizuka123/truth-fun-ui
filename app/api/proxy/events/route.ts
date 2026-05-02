export const runtime = 'edge'

const METADATA_BASE = {
  dev: 'https://dev-prediction-markets-api.dflow.net',
  prod: 'https://prediction-markets-api.dflow.net',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const env = (process.env.NEXT_PUBLIC_DFLOW_ENV ?? 'dev') as 'dev' | 'prod'

  const url = new URL('/api/v1/events', METADATA_BASE[env])
  url.searchParams.set('withNestedMarkets', 'true')

  const status = searchParams.get('status') ?? 'active'
  if (status !== 'all') url.searchParams.set('status', status)

  url.searchParams.set('sort', searchParams.get('sort') ?? 'volume24h')
  url.searchParams.set('limit', searchParams.get('limit') ?? '50')

  const cursor = searchParams.get('cursor')
  if (cursor) url.searchParams.set('cursor', cursor)

  const seriesTickers = searchParams.get('seriesTickers')
  if (seriesTickers) url.searchParams.set('seriesTickers', seriesTickers)

  const headers: HeadersInit = {}
  const apiKey = process.env.DFLOW_API_KEY
  if (apiKey) headers['x-api-key'] = apiKey

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) {
    return new Response(await res.text(), { status: res.status })
  }

  const data = await res.json()
  // active markets change frequently; resolved markets are stable
  const ttl = status === 'closed' ? 300 : 30

  return Response.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
    },
  })
}
