'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { SketchButton } from '@/components/ui/SketchButton'

type Step = 'select' | 'connecting' | 'connected' | 'profile'

const WALLETS = [
  { id: 'phantom', name: 'Phantom', icon: '👻', color: '#AB9FF2' },
  { id: 'solflare', name: 'Solflare', icon: '☀️', color: '#00D4FF' },
  { id: 'backpack', name: 'Backpack', icon: '🎒', color: '#12F0FF' },
  { id: 'ledger', name: 'Ledger', icon: '🛡️', color: '#000' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', color: '#3B99FC' },
]

export function ConnectWalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>('select')
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)

  const handleSelectWallet = (walletId: string) => {
    setSelectedWallet(walletId)
    setStep('connecting')
    // Simulate connection
    setTimeout(() => {
      setStep('connected')
    }, 2000)
    setTimeout(() => {
      setStep('profile')
    }, 3000)
  }

  const handleDisconnect = () => {
    setStep('select')
    setSelectedWallet(null)
  }

  const handleClose = () => {
    handleDisconnect()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -2, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, rotate: -2, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="sketch-border border-4 border-border bg-bg-card rounded-2xl p-8 shadow-2xl" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 40px rgba(90,158,255,0.2)' }}>
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-xl hover:rotate-90 transition-transform"
              >
                ✕
              </button>

              <AnimatePresence mode="wait">
                {step === 'select' && (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="font-display text-3xl font-bold text-ink mb-2">Connect Wallet</h2>
                    <p className="font-ui text-sm text-ink-muted mb-8">Choose your Solana wallet to get started</p>

                    <div className="space-y-3">
                      {WALLETS.map((wallet) => (
                        <motion.button
                          key={wallet.id}
                          whileHover={{ scale: 1.06, x: 8, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleSelectWallet(wallet.id)}
                          className="sketch-border w-full px-6 py-4 border-3 border-border rounded-xl bg-bg-secondary hover:bg-bg-card transition-all flex items-center gap-4"
                          style={{ boxShadow: 'none', transition: 'box-shadow 0.3s' }}
                          onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 8px 16px rgba(91, 163, 255, 0.3), 0 0 20px rgba(${wallet.id === 'phantom' ? '171,159,242' : '58,144,255'}), 0.1)`}
                          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                        >
                          <span className="text-3xl">{wallet.icon}</span>
                          <span className="font-display text-lg font-600 text-ink flex-1 text-left">{wallet.name}</span>
                          <span className="text-2xl text-ink-light">→</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'connecting' && (
                  <motion.div
                    key="connecting"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-8"
                  >
                    <div className="inline-block mb-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="w-16 h-16 border-4 border-border border-t-accent-blue rounded-full"
                      />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-ink mb-2">Connecting...</h3>
                    <p className="font-ui text-sm text-ink-muted mb-6">
                      {selectedWallet && `Approve in your ${WALLETS.find((w) => w.id === selectedWallet)?.name} wallet`}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden mb-4">
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent-blue to-accent-purple"
                        animate={{ width: '100%' }}
                        transition={{ duration: 2 }}
                      />
                    </div>
                  </motion.div>
                )}

                {step === 'connected' && (
                  <motion.div
                    key="connected"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.6 }}
                      className="text-6xl mb-4"
                    >
                      ✓
                    </motion.div>
                    <h3 className="font-display text-2xl font-bold text-accent-green mb-2">Connected!</h3>
                    <p className="font-ui text-sm text-ink-muted">Loading your profile...</p>
                  </motion.div>
                )}

                {step === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="font-display text-2xl font-bold text-ink mb-6">Your Profile</h3>

                    {/* Balance Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="sketch-border border-3 border-border rounded-xl p-6 bg-bg-secondary mb-6"
                    >
                      <p className="font-ui text-xs text-ink-muted uppercase tracking-wider mb-2">SOL Balance</p>
                      <p className="font-mono text-3xl font-bold text-ink">12.459</p>
                      <p className="font-ui text-xs text-ink-muted mt-1">≈ $1,891.48</p>
                    </motion.div>

                    {/* Positions */}
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6"
                    >
                      <p className="font-ui text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Active Positions</p>
                      <div className="space-y-2">
                        {[
                          { market: 'BTC > $100k?', position: 'YES', amount: '2.5 SOL' },
                          { market: 'ETH ETF approved?', position: 'NO', amount: '1.8 SOL' },
                        ].map((pos, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + i * 0.05 }}
                            className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border-2 border-border"
                          >
                            <div>
                              <p className="font-ui text-sm font-600 text-ink">{pos.market}</p>
                              <p className="font-mono text-xs text-ink-muted">{pos.position}</p>
                            </div>
                            <p className="font-mono text-sm font-bold text-ink">{pos.amount}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex gap-3"
                    >
                      <SketchButton primary className="flex-1">
                        Trade
                      </SketchButton>
                      <button
                        onClick={handleDisconnect}
                        className="flex-1 px-4 py-3 font-display font-600 text-ink border-3 border-border rounded-lg hover:bg-bg-secondary transition-colors sketch-border"
                      >
                        Disconnect
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
