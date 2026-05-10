'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useWallet } from '@solana/wallet-adapter-react'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'
const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC ?? ''
const DISMISS_KEY = 'tf-wallet-network-hint-dismissed'

interface BackendConfig {
  network: string | null
  rpcUrl: string | null
}

function deriveNetwork(rpc: string, backendNetwork: string | null | undefined): 'localnet' | 'devnet' | 'mainnet' | 'unknown' {
  if (backendNetwork === 'localnet' || rpc.includes('127.0.0.1') || rpc.includes('localhost')) return 'localnet'
  if (backendNetwork === 'devnet' || rpc.includes('api.devnet')) return 'devnet'
  if (rpc.includes('mainnet') || backendNetwork === 'mainnet') return 'mainnet'
  return 'unknown'
}

/**
 * Phantom and other wallet adapters don't expose which cluster the wallet is
 * currently signing against — so the only failure mode users see is "Failed to
 * simulate" deep inside the wallet popup. This banner fires whenever the app's
 * own RPC isn't pointed at mainnet, since that's the only configuration where
 * a default Phantom install just works without manual setup.
 */
export default function WalletNetworkHint() {
  const { connected } = useWallet()
  const [dismissed, setDismissed] = useState<boolean>(true) // start dismissed to avoid SSR flicker

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  const { data: config } = useSWR<BackendConfig>(
    'backend-config',
    () => fetch(`${BACKEND_URL}/api/config`).then((r) => r.json()),
    { revalidateOnFocus: false },
  )

  const network = deriveNetwork(RPC, config?.network)
  if (!connected) return null
  if (dismissed) return null
  if (network === 'mainnet' || network === 'unknown') return null

  const isLocal = network === 'localnet'
  const target = isLocal
    ? { name: 'Localhost', endpoint: 'http://127.0.0.1:8899' }
    : { name: 'Devnet', endpoint: 'https://api.devnet.solana.com' }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-4">
      <div
        className="flex items-start justify-between gap-4 rounded-xl px-4 py-3 text-xs font-mono"
        style={{
          backgroundColor: 'rgba(168,139,250,0.08)',
          border: '1px solid rgba(168,139,250,0.3)',
          color: '#A78BFA',
        }}
      >
        <div>
          This app is running on <strong>{target.name}</strong>. If your wallet
          rejects trades with &quot;Failed to simulate&quot;, switch its RPC to{' '}
          <code className="px-1 py-0.5 rounded bg-black/40">{target.endpoint}</code>{' '}
          (Phantom → Settings → Developer Settings → Testnet Mode / Custom RPC).
        </div>
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1')
            setDismissed(true)
          }}
          className="shrink-0 px-2 py-1 rounded transition-colors"
          style={{
            border: '1px solid rgba(168,139,250,0.4)',
            color: '#A78BFA',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
