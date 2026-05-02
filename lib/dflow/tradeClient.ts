import type { OrderResponse, OrderStatusResponse } from './types'

export interface GetOrderParams {
  inputMint: string
  outputMint: string
  amount: number
  userPublicKey?: string
  slippageBps?: number | 'auto'
  predictionMarketSlippageBps?: number | 'auto'
  prioritizationFeeLamports?: number | 'auto' | 'medium' | 'high' | 'veryHigh' | 'disabled'
  dynamicComputeUnitLimit?: boolean
  platformFeeBps?: number
  platformFeeScale?: number
  feeAccount?: string
  sponsor?: string
  destinationWallet?: string
  destinationTokenAccount?: string
  allowSyncExec?: boolean
  allowAsyncExec?: boolean
  onlyJitRoutes?: boolean
  forJitoBundle?: boolean
  outcomeAccountRentRecipient?: string
  predictionMarketInitPayer?: string
}

// Trade API calls go through /api/proxy/* (Edge Functions) to fix CORS
// Never call DFlow trade API directly from browser
export async function getOrder(params: GetOrderParams): Promise<OrderResponse> {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) qs.set(key, String(value))
  }
  const res = await fetch(`/api/proxy/order?${qs}`)
  if (!res.ok) throw new Error(`Order error: ${res.status}`)
  return res.json()
}

export async function getOrderStatus(params: {
  signature: string
  lastValidBlockHeight?: number | null
}): Promise<OrderStatusResponse> {
  const qs = new URLSearchParams()
  qs.set('signature', params.signature)
  if (params.lastValidBlockHeight != null) {
    qs.set('lastValidBlockHeight', String(params.lastValidBlockHeight))
  }
  const res = await fetch(`/api/proxy/order-status?${qs}`)
  if (!res.ok) throw new Error(`Status error: ${res.status}`)
  return res.json()
}
