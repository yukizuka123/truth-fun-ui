'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'
const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC ?? ''

interface BackendHealth {
  ok: boolean
  mode: string
  uptimeSec: number
  stubbedOracle: boolean
}

interface BackendConfig {
  network: string | null
  rpcUrl: string | null
  usdcMint: string | null
  truthFunProgram: string | null
  mockDflowProgram: string | null
}

interface WalletStatus {
  pubkey: string
  sol: number
  usdc: number
  network: string | null
  usdcMint: string | null
}

function networkLabel(rpc: string, backendNetwork: string | null | undefined): string {
  if (backendNetwork === 'localnet' || rpc.includes('127.0.0.1') || rpc.includes('localhost')) return 'Localnet'
  if (backendNetwork === 'devnet' || rpc.includes('api.devnet')) return 'Devnet'
  if (rpc.includes('mainnet')) return 'Mainnet'
  return backendNetwork ?? 'unknown'
}

function networkColor(label: string): string {
  if (label === 'Localnet') return '#22C55E'
  if (label === 'Devnet') return '#A78BFA'
  if (label === 'Mainnet') return '#EF4444'
  return '#94A3B8'
}

export default function TopHeader() {
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [faucetState, setFaucetState] = useState<'idle' | 'pending' | 'ok' | 'err'>('idle')
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const savedTheme = (localStorage.getItem('tf-theme') as 'dark' | 'light' | null) || 'dark'
    setTheme(savedTheme)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('tf-theme', newTheme)
  }

  const { data: health } = useSWR<BackendHealth>(
    'backend-health',
    () => fetch(`${BACKEND_URL}/health`).then((r) => r.json()),
    { refreshInterval: 5000, revalidateOnFocus: false },
  )
  const { data: config } = useSWR<BackendConfig>(
    'backend-config',
    () => fetch(`${BACKEND_URL}/api/config`).then((r) => r.json()),
    { revalidateOnFocus: false },
  )
  const { data: walletStat, mutate: refreshWallet } = useSWR<WalletStatus | null>(
    publicKey ? `wallet-${publicKey.toBase58()}` : null,
    async () => {
      if (!publicKey) return null
      const res = await fetch(`${BACKEND_URL}/api/wallet/${publicKey.toBase58()}`)
      if (!res.ok) return null
      return (await res.json()) as WalletStatus
    },
    { refreshInterval: 4000, revalidateOnFocus: false },
  )

  useEffect(() => {
    if (connected) refreshWallet()
  }, [connected, refreshWallet])

  const network = networkLabel(RPC, config?.network)
  const networkClr = networkColor(network)
  const backendOk = !!health?.ok

  const handleFaucet = async () => {
    if (!publicKey) return
    setFaucetState('pending')
    setFaucetMsg(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/faucet/airdrop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubkey: publicKey.toBase58(), solAmount: 2, usdcAmount: 1000 }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `${res.status}`)
      }
      const body = (await res.json()) as { newSol: number; newUsdc: number }
      setFaucetMsg(`+ ${body.newSol.toFixed(2)} SOL · ${body.newUsdc.toFixed(0)} USDC`)
      setFaucetState('ok')
      refreshWallet()
      setTimeout(() => setFaucetState('idle'), 4000)
    } catch (err) {
      setFaucetMsg((err as Error).message)
      setFaucetState('err')
      setTimeout(() => setFaucetState('idle'), 6000)
    }
  }

  const truncated = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : null

  return (
    <motion.nav
      className="sketch-border fixed top-0 left-0 right-0 z-100 border-b-4 border-dashed border-ink"
      style={{
        backgroundColor: scrolled ? 'var(--bg-secondary)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-2xl font-bold text-ink">
            truth<span className="text-accent-blue">.fun</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-8">
          <Link href="/markets" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors">Markets</Link>
          <Link href="/#how-it-works" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors">How It Works</Link>
          <Link href="#" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors">Leaderboard</Link>
          <Link href="#" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors">Docs</Link>
        </div>

        {/* Right: dev pills + theme + wallet/faucet */}
        <div className="flex items-center gap-2">
          {/* Dev pills (compact) */}
          <span
            className="hidden md:inline-block text-[10px] font-mono px-2 py-1 rounded-md uppercase tracking-wide"
            style={{
              backgroundColor: `${networkClr}1A`,
              border: `1px solid ${networkClr}66`,
              color: networkClr,
            }}
            title={`RPC ${RPC}`}
          >
            ● {network}
          </span>

          <span
            className="hidden md:inline-block text-[10px] font-mono px-2 py-1 rounded-md uppercase tracking-wide"
            style={{
              backgroundColor: backendOk ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${backendOk ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: backendOk ? '#22C55E' : '#EF4444',
            }}
            title={
              backendOk
                ? `backend ${BACKEND_URL} · mode=${health?.mode} · uptime=${health?.uptimeSec}s`
                : `backend unreachable at ${BACKEND_URL}`
            }
          >
            backend {backendOk ? 'ok' : 'down'}
          </span>

          {/* Wallet info: shown when connected, replaces the standalone WalletButton */}
          {connected && walletStat && (
            <>
              <div
                className="hidden md:flex items-center gap-3 text-xs font-mono px-3 py-1.5 rounded-lg sketch-border border-2 border-border"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <span style={{ color: walletStat.sol > 0 ? 'var(--accent-green)' : '#EF4444' }}>
                  {walletStat.sol.toFixed(3)} SOL
                </span>
                <span style={{ color: 'var(--ink-muted)' }}>·</span>
                <span style={{ color: walletStat.usdc > 0 ? 'var(--accent-green)' : '#EF4444' }}>
                  {walletStat.usdc.toFixed(2)} USDC
                </span>
              </div>

              <button
                onClick={handleFaucet}
                disabled={faucetState === 'pending'}
                className="hidden sm:inline-block text-[11px] font-mono px-2.5 py-1.5 rounded-md transition-colors"
                style={{
                  backgroundColor:
                    faucetState === 'ok'
                      ? 'rgba(34,197,94,0.2)'
                      : faucetState === 'err'
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(168,139,250,0.15)',
                  border: `1px solid ${
                    faucetState === 'ok'
                      ? 'rgba(34,197,94,0.5)'
                      : faucetState === 'err'
                      ? 'rgba(239,68,68,0.5)'
                      : 'rgba(168,139,250,0.4)'
                  }`,
                  color:
                    faucetState === 'ok'
                      ? '#22C55E'
                      : faucetState === 'err'
                      ? '#EF4444'
                      : '#A78BFA',
                  cursor: faucetState === 'pending' ? 'wait' : 'pointer',
                }}
                title={faucetMsg ?? 'Airdrop 2 SOL + 1000 USDC to your wallet'}
              >
                {faucetState === 'pending'
                  ? 'Funding…'
                  : faucetState === 'ok'
                  ? `✓ ${faucetMsg}`
                  : faucetState === 'err'
                  ? `✗ ${faucetMsg?.slice(0, 30) ?? 'failed'}`
                  : '+ Test Funds'}
              </button>
            </>
          )}

          {/* Theme toggle */}
          {mounted && (
            <motion.button
              onClick={toggleTheme}
              whileHover={{ rotate: 20, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="sketch-border w-9 h-9 rounded-lg border-2 border-border-strong flex items-center justify-center text-ink text-base"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </motion.button>
          )}

          {/* Connect / Disconnect */}
          {connected ? (
            <button
              onClick={disconnect}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg sketch-border border-2 border-border hover:border-accent-green/40 transition-colors"
              title={publicKey?.toBase58()}
            >
              <span className="font-mono text-sm text-ink">{truncated}</span>
            </button>
          ) : (
            <button
              onClick={() => setVisible(true)}
              className="px-4 py-2 rounded-lg bg-accent-green text-[#0f0e0c] font-ui font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Connect Wallet
            </button>
          )}

          {/* Mobile menu hamburger */}
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col gap-1.5 ml-1"
            aria-label="Open menu"
          >
            <motion.span className="block w-6 h-0.5 bg-ink" animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 10 : 0 }} transition={{ duration: 0.3 }} />
            <motion.span className="block w-6 h-0.5 bg-ink" animate={{ opacity: menuOpen ? 0 : 1 }} transition={{ duration: 0.3 }} />
            <motion.span className="block w-6 h-0.5 bg-ink" animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -10 : 0 }} transition={{ duration: 0.3 }} />
          </motion.button>
        </div>
      </div>

      {/* Mobile drawer */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: menuOpen ? 'auto' : 0, opacity: menuOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="lg:hidden overflow-hidden border-t-2 border-dashed border-border"
      >
        <div className="px-6 py-4 flex flex-col gap-3 bg-bg-secondary">
          <Link href="/markets" className="font-ui text-sm font-medium text-ink-light hover:text-ink" onClick={() => setMenuOpen(false)}>Markets</Link>
          <Link href="/#how-it-works" className="font-ui text-sm font-medium text-ink-light hover:text-ink" onClick={() => setMenuOpen(false)}>How It Works</Link>
          <Link href="#" className="font-ui text-sm font-medium text-ink-light hover:text-ink" onClick={() => setMenuOpen(false)}>Leaderboard</Link>
          <Link href="#" className="font-ui text-sm font-medium text-ink-light hover:text-ink" onClick={() => setMenuOpen(false)}>Docs</Link>
          {connected && walletStat && (
            <div className="text-xs font-mono pt-2 border-t border-border" style={{ color: 'var(--ink-muted)' }}>
              {walletStat.sol.toFixed(3)} SOL · {walletStat.usdc.toFixed(2)} USDC
            </div>
          )}
          {connected && (
            <button
              onClick={handleFaucet}
              className="text-[11px] font-mono px-2.5 py-1.5 rounded-md self-start"
              style={{ backgroundColor: 'rgba(168,139,250,0.15)', border: '1px solid rgba(168,139,250,0.4)', color: '#A78BFA' }}
            >
              {faucetState === 'pending' ? 'Funding…' : '+ Test Funds'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.nav>
  )
}
