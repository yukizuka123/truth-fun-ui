'use client'

import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useEffect, useState } from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export default function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet()
  const { setVisible } = useWalletModal()
  const { connection } = useConnection()
  const [solBalance, setSolBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!publicKey) {
      setSolBalance(null)
      return
    }
    connection
      .getBalance(publicKey)
      .then((b) => setSolBalance(b / LAMPORTS_PER_SOL))
      .catch(() => setSolBalance(null))
  }, [publicKey, connection])

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="px-4 py-2 rounded-lg bg-accent-green text-[#0f0e0c] font-ui font-semibold
                   text-sm hover:opacity-90 transition-opacity"
      >
        Connect Wallet
      </button>
    )
  }

  const addr = publicKey.toBase58()
  const truncated = `${addr.slice(0, 4)}...${addr.slice(-4)}`

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-border">
        <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
        <span className="text-xs text-ink-muted font-mono">devnet</span>
      </div>
      <button
        onClick={disconnect}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card
                   border border-border hover:border-accent-green/40 transition-colors"
      >
        {solBalance !== null && (
          <span className="font-mono text-xs text-accent-green">
            {solBalance.toFixed(3)} SOL
          </span>
        )}
        <span className="font-mono text-sm text-ink">{truncated}</span>
      </button>
    </div>
  )
}
