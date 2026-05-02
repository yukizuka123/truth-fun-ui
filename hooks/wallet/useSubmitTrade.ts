'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { USDC_MINT } from '@/lib/dflow/config'

export interface OrderParams {
  outputMint: string
  usdcAmount: number
  slippageBps?: number
}

export interface OrderResponse {
  transaction: string
  executionMode: 'sync' | 'async'
  outAmount: string
  inAmount: string
  lastValidBlockHeight: number
  initPredictionMarketCost?: number
}

export interface OrderStatusResponse {
  status: 'open' | 'closed' | 'expired' | 'failed'
  signature: string
}

export function useSubmitTrade() {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const [signature, setSignature] = useState<string | null>(null)

  const trade = useMutation({
    mutationFn: async (params: OrderParams) => {
      if (!publicKey || !signTransaction) throw new Error('Wallet not connected')

      const amount = Math.round(params.usdcAmount * 1_000_000)

      const res = await fetch(`/api/proxy/order?${new URLSearchParams({
        inputMint: USDC_MINT,
        outputMint: params.outputMint,
        amount: amount.toString(),
        userPublicKey: publicKey.toBase58(),
        slippageBps: (params.slippageBps ?? 100).toString(),
        prioritizationFeeLamports: 'auto',
      })}`)

      if (!res.ok) throw new Error(`Order failed: ${res.status}`)
      const order: OrderResponse = await res.json()

      if (!order.transaction) throw new Error('No transaction returned')

      const tx = VersionedTransaction.deserialize(Buffer.from(order.transaction, 'base64'))
      const signed = await signTransaction(tx)
      const sig = await connection.sendTransaction(signed)
      setSignature(sig)
      return { signature: sig, order }
    },
  })

  const status = useQuery({
    queryKey: ['order-status', signature],
    enabled: !!signature,
    queryFn: async () => {
      const res = await fetch(`/api/proxy/order-status?signature=${signature}`)
      return res.json() as Promise<OrderStatusResponse>
    },
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s && ['closed', 'expired', 'failed'].includes(s) ? false : 2000
    },
    staleTime: 0,
  })

  return { trade, status, signature }
}
