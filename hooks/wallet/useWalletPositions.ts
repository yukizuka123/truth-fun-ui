import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID, DFLOW } from '@/lib/dflow/config'
import { useQuery } from '@tanstack/react-query'

export interface Position {
  mint: string
  balance: number
  market?: any
  side?: 'YES' | 'NO' | 'UNKNOWN'
}

export function useWalletPositions() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  return useQuery({
    queryKey: ['wallet', 'positions', publicKey?.toBase58()],
    enabled: !!publicKey,
    queryFn: async () => {
      if (!publicKey) return []

      // Step 1: fetch Token-2022 accounts
      const accounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey(TOKEN_2022_PROGRAM_ID) }
      )

      const nonZero = accounts.value
        .map(({ account }) => account.data.parsed.info)
        .filter((i: any) => parseFloat(i.tokenAmount.amount) > 0)
        .map((i: any) => ({ mint: i.mint, balance: i.tokenAmount.uiAmount }))

      if (nonZero.length === 0) return []

      // Step 2: filter outcome mints
      const filterRes = await fetch(`${DFLOW.metadata}/api/v1/filter_outcome_mints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: nonZero.map(t => t.mint) }),
      })
      const { outcomeMints } = await filterRes.json()
      const outcomeTokens = nonZero.filter(t => outcomeMints.includes(t.mint))

      if (outcomeTokens.length === 0) return []

      // Step 3: batch fetch markets
      const batchRes = await fetch(`${DFLOW.metadata}/api/v1/markets/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mints: outcomeTokens.map(t => t.mint) }),
      })
      const { markets } = await batchRes.json()

      // Step 4: map mint → YES/NO
      const mintToMarket = new Map()
      markets.forEach((m: any) => {
        Object.values(m.accounts ?? {}).forEach((acc: any) => {
          if (acc.yesMint) mintToMarket.set(acc.yesMint, { market: m, side: 'YES' })
          if (acc.noMint) mintToMarket.set(acc.noMint, { market: m, side: 'NO' })
        })
      })

      return outcomeTokens.map(t => ({
        ...t,
        ...(mintToMarket.get(t.mint) ?? { market: null, side: 'UNKNOWN' }),
      })) as Position[]
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}
