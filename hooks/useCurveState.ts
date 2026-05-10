'use client'

import useSWR from 'swr'
import {
  fetchOnchainSnapshot,
  type OnchainCurveSnapshot,
} from '@/lib/anchor'
import type { CurveState } from '@/lib/math'

const D = 1_000_000

function snapshotToYesCurve(snap: OnchainCurveSnapshot): CurveState {
  const x = Number(BigInt(snap.curveYesSupply)) / D
  const y =
    (Number(BigInt(snap.virtualYesReserve)) +
      Number(BigInt(snap.curveUsdcReserve))) /
    D
  return { x, y, k: x * y }
}

function snapshotToNoCurve(snap: OnchainCurveSnapshot): CurveState {
  const x = Number(BigInt(snap.curveNoSupply)) / D
  const y =
    (Number(BigInt(snap.virtualNoReserve)) +
      Number(BigInt(snap.curveNoReserve))) /
    D
  return { x, y, k: x * y }
}

export interface UseCurveStateResult {
  // Legacy compatibility (existing PriceChart, BonusPoolTracker etc.)
  curveState?: CurveState
  curvePrice: number | null
  // New rich data
  yesCurve?: CurveState
  noCurve?: CurveState
  yesPrice: number | null
  noPrice: number | null
  bonusPoolUsdc: number
  totalTfYesMinted: number
  totalTfNoMinted: number
  status: 'active' | 'resolved' | 'unknown'
  winningSide: 'yes' | 'no' | 'undecided' | 'unknown'
  closeTime: number | null
  truthFunMarket: string | null
  isLoading: boolean
  error: Error | undefined
  refresh: () => void
  /** True when the backend has no on-chain market for this ticker. */
  notRegistered: boolean
}

/**
 * Fetches the rich on-chain Market snapshot via the backend's `/api/curve/:ticker`
 * endpoint. Polls every 3s.
 *
 * Returns a backwards-compatible `curveState`/`curvePrice` (YES side) so the
 * existing PriceChart / BonusPoolTracker / TradePanel preview math keeps working,
 * plus the full snapshot for new components.
 */
export function useCurveState(marketId: string): UseCurveStateResult {
  const { data, error, isLoading, mutate } = useSWR<OnchainCurveSnapshot | null>(
    `curve-${marketId}`,
    () => fetchOnchainSnapshot(marketId),
    { refreshInterval: 3000, revalidateOnFocus: false },
  )

  const yesCurve = data ? snapshotToYesCurve(data) : undefined
  const noCurve = data ? snapshotToNoCurve(data) : undefined
  const yesPrice = data ? data.yesPriceBps / 10_000 : null
  const noPrice = data ? data.noPriceBps / 10_000 : null

  const status =
    data?.status === 'active' || data?.status === 'resolved'
      ? data.status
      : 'unknown'
  const winningSide =
    data?.winningSide === 'yes' || data?.winningSide === 'no' || data?.winningSide === 'undecided'
      ? data.winningSide
      : 'unknown'

  return {
    curveState: yesCurve,
    curvePrice: yesPrice,
    yesCurve,
    noCurve,
    yesPrice,
    noPrice,
    bonusPoolUsdc: data ? Number(BigInt(data.bonusPoolUsdc)) / D : 0,
    totalTfYesMinted: data ? Number(BigInt(data.totalTfYesMinted)) / D : 0,
    totalTfNoMinted: data ? Number(BigInt(data.totalTfNoMinted)) / D : 0,
    status,
    winningSide,
    closeTime: data?.closeTime ?? null,
    truthFunMarket: data?.truthFunMarket ?? null,
    isLoading,
    error: error as Error | undefined,
    refresh: () => {
      void mutate()
    },
    notRegistered: !isLoading && !error && data === null,
  }
}
