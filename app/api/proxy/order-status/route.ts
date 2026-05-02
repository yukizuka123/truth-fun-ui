export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const env = process.env.NEXT_PUBLIC_DFLOW_ENV ?? 'dev'
  const base = env === 'prod'
    ? 'https://quote-api.dflow.net'
    : 'https://dev-quote-api.dflow.net'

  const url = new URL(`${base}/order-status`)
  searchParams.forEach((v, k) => url.searchParams.set(k, v))

  const headers: HeadersInit = {}
  const apiKey = process.env.DFLOW_API_KEY
  if (apiKey) headers['x-api-key'] = apiKey

  const res = await fetch(url.toString(), { headers })
  const data = await res.json()

  return Response.json(data, { status: res.status })
}
