// Server-side only. Never import from a 'use client' component.

const ENV = process.env.DFLOW_ENV ?? process.env.NEXT_PUBLIC_DFLOW_ENV ?? 'dev'
const isProd = ENV === 'prod'

const BASE = isProd
  ? process.env.DFLOW_PROD_BASE ?? 'https://prediction-markets-api.dflow.net'
  : process.env.DFLOW_DEV_BASE ?? 'https://dev-prediction-markets-api.dflow.net'

const API_KEY = isProd ? process.env.DFLOW_API_KEY : undefined

type QueryParams = Record<string, string | number | boolean | undefined | null>

export class DFlowError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'DFlowError'
  }
}

export async function dflow<T>(path: string, params?: QueryParams): Promise<T> {
  if (isProd && !API_KEY) {
    throw new DFlowError(500, 'DFLOW_ENV=prod requires DFLOW_API_KEY to be set')
  }

  const url = new URL(`/api/v1${path}`, BASE)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new DFlowError(res.status, `DFlow ${res.status} on ${path}: ${body.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

export async function handle<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const data = await fn()
    return Response.json(data)
  } catch (err) {
    if (err instanceof DFlowError) {
      return Response.json({ error: err.message }, { status: err.status })
    }
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
