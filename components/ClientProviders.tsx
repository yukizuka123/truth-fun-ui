'use client'

import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import TruthFunWalletProvider from '@/providers/WalletProvider'
import { FloatingDoodles } from '@/components/ui/FloatingDoodles'
import { IS_STUB } from '@/lib/dflow'
import { useBackendWs } from '@/hooks/useBackendWs'
import { ReactNode } from 'react'

function BackendWsBridge() {
  useBackendWs()
  return null
}

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TruthFunWalletProvider>
          <BackendWsBridge />
          <FloatingDoodles />
          {IS_STUB && (
            <div className="w-full bg-accent-yellow/10 border-b border-accent-yellow/30 px-4 py-2 text-center fixed top-0 left-0 right-0 z-40">
              <span className="text-xs font-mono text-accent-yellow">
                ⚠ Demo mode — DFlow integration pending. Showing simulated data.
              </span>
            </div>
          )}
          <div id="app">{children}</div>
        </TruthFunWalletProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
