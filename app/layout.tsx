import type { Metadata } from 'next'
import './globals.css'
import { SketchFilters } from '@/components/ui/SketchFilters'
import { ClientProviders } from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: 'truth.fun — Prediction Markets with Bonding Curves',
  description:
    'The pump.fun for prediction markets. Trade YES/NO on bonding curves, earn bonus yield, and arb the spread on Solana.',
  openGraph: {
    title: 'truth.fun',
    description:
      'Prediction markets with memecoin-style early-buyer mechanics + bonus yield flywheel on Solana.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Shantell+Sans:wght@400;500;600;700;800&family=Caveat:wght@400;500;600;700&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SketchFilters />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
