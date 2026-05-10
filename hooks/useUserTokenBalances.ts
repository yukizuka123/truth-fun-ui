'use client'

import useSWR from 'swr'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'

import {
  fetchOnchainMarkets,
  type OnchainMarketEntry,
} from '@/lib/anchor'

const D = 1_000_000

async function getTokenBalance(
  connection: Connection,
  ata: PublicKey,
): Promise<number> {
  try {
    const res = await connection.getTokenAccountBalance(ata)
    return Number(BigInt(res.value.amount)) / D
  } catch {
    // ATA doesn't exist yet — user simply has zero of this side.
    return 0
  }
}

export interface UseUserTokenBalancesResult {
  tfYes: number
  tfNo: number
  tfYesMint: string | null
  tfNoMint: string | null
  isLoading: boolean
  refresh: () => void
}

/**
 * Reads the connected wallet's tfYES / tfNO balances for a given market via
 * RPC `getTokenAccountBalance`. Polls every 8s and exposes a `refresh()` for
 * manual revalidation immediately after a trade.
 *
 * Returns 0 for both sides if the wallet isn't connected or the market isn't
 * registered on-chain yet.
 */
export function useUserTokenBalances(
  marketId: string,
): UseUserTokenBalancesResult {
  const { connection } = useConnection()
  const wallet = useWallet()

  const { data: markets } = useSWR<OnchainMarketEntry[]>(
    'markets-onchain',
    () => fetchOnchainMarkets(),
    { refreshInterval: 60_000, revalidateOnFocus: false },
  )

  const entry = markets?.find((m) => m.kalshiTicker === marketId) ?? null
  const owner = wallet.publicKey?.toBase58() ?? null

  const key =
    entry && owner ? `tf-balances-${entry.truthFunMarket}-${owner}` : null

  const { data, isLoading, mutate } = useSWR(
    key,
    async () => {
      if (!entry || !wallet.publicKey) return { tfYes: 0, tfNo: 0 }
      const tfYesMint = new PublicKey(entry.tfYesMint)
      const tfNoMint = new PublicKey(entry.tfNoMint)
      const yesAta = getAssociatedTokenAddressSync(
        tfYesMint,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID,
      )
      const noAta = getAssociatedTokenAddressSync(
        tfNoMint,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID,
      )
      const [tfYes, tfNo] = await Promise.all([
        getTokenBalance(connection, yesAta),
        getTokenBalance(connection, noAta),
      ])
      return { tfYes, tfNo }
    },
    { refreshInterval: 8000, revalidateOnFocus: false },
  )

  return {
    tfYes: data?.tfYes ?? 0,
    tfNo: data?.tfNo ?? 0,
    tfYesMint: entry?.tfYesMint ?? null,
    tfNoMint: entry?.tfNoMint ?? null,
    isLoading: isLoading || (!data && !!key),
    refresh: () => {
      void mutate()
    },
  }
}
