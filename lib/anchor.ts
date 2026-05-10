/**
 * UI ↔ Truth.fun on-chain client.
 *
 * Reads:  fetch the rich snapshot from backend `/api/curve/:ticker` so we get
 *         the on-chain Market account in one round trip without the UI having
 *         to derive PDAs for every consumer.
 *
 * Writes: build Anchor instructions client-side using the connected wallet
 *         (Phantom/Backpack/Solflare/etc.), sign + send.
 */

import { AnchorProvider, BN, Idl, Program } from '@coral-xyz/anchor'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

import truthFunIdl from '@/idl/truth_fun_contracts.json'
import mockDflowIdl from '@/idl/mock_dflow_contracts.json'
import { CurveState } from './math'

// ─── Config ─────────────────────────────────────────────────────────────────

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? 'http://127.0.0.1:8899'

const D = 1_000_000 // all SPL tokens (USDC, tfYES, tfNO, dflowYES/NO) use 6 decimals

// Program IDs come from the IDLs themselves (Anchor 0.31+ writes them into
// idl.address), with env override for non-default deployments.
function pkFromEnv(envVar: string, fallback: string): PublicKey {
  return new PublicKey(process.env[envVar] ?? fallback)
}

// idl.address is the canonical place; fall back to env if missing.
const truthFunAddr =
  (truthFunIdl as { address?: string }).address ??
  process.env.NEXT_PUBLIC_TRUTH_FUN_PROGRAM
const mockDflowAddr =
  (mockDflowIdl as { address?: string }).address ??
  process.env.NEXT_PUBLIC_MOCK_DFLOW_PROGRAM

if (!truthFunAddr || !mockDflowAddr) {
  // eslint-disable-next-line no-console
  console.warn(
    '[anchor] Missing program ids — IDL.address fields empty and NEXT_PUBLIC_TRUTH_FUN_PROGRAM/NEXT_PUBLIC_MOCK_DFLOW_PROGRAM not set. On-chain calls will fail.',
  )
}

export const TRUTH_FUN_PROGRAM_ID = new PublicKey(
  truthFunAddr ?? '11111111111111111111111111111111',
)
export const MOCK_DFLOW_PROGRAM_ID = new PublicKey(
  mockDflowAddr ?? '11111111111111111111111111111111',
)

// ─── Backend bridge ─────────────────────────────────────────────────────────

export interface OnchainMarketEntry {
  kalshiTicker: string
  mockMarketId: string
  dflowYesMint: string
  dflowNoMint: string
  truthFunMarket: string
  tfYesMint: string
  tfNoMint: string
  usdcVault: string
  closeTime: number
  createdAt: number
}

export interface OnchainCurveSnapshot {
  kalshiTicker: string
  truthFunMarket: string
  curveYesSupply: string
  virtualYesReserve: string
  curveUsdcReserve: string
  curveNoSupply: string
  virtualNoReserve: string
  curveNoReserve: string
  yesPriceBps: number
  noPriceBps: number
  bonusPoolUsdc: string
  totalTfYesMinted: string
  totalTfNoMinted: string
  closeTime: number
  status: string
  winningSide: string
}

export async function fetchOnchainMarkets(): Promise<OnchainMarketEntry[]> {
  const res = await fetch(`${BACKEND_URL}/api/markets/onchain`)
  if (!res.ok) throw new Error(`backend ${res.status}`)
  const body = (await res.json()) as { markets: OnchainMarketEntry[] }
  return body.markets
}

export async function fetchOnchainSnapshot(
  ticker: string,
): Promise<OnchainCurveSnapshot | null> {
  const res = await fetch(
    `${BACKEND_URL}/api/curve/${encodeURIComponent(ticker)}`,
  )
  if (res.status === 503) return null
  if (!res.ok) throw new Error(`backend ${res.status}`)
  const body = (await res.json()) as Partial<OnchainCurveSnapshot> & {
    curveBps?: number
  }
  // Old endpoint shape was {curveBps, ts}. Reject — caller should treat as null.
  if (!body.kalshiTicker) return null
  return body as OnchainCurveSnapshot
}

export async function ensureOnchainMarket(
  kalshiTicker: string,
  opts?: { yesBpsOverride?: number; closeInSec?: number },
): Promise<OnchainMarketEntry> {
  const res = await fetch(`${BACKEND_URL}/api/markets/onchain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kalshiTicker, ...opts }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`backend ${res.status}: ${body.slice(0, 200)}`)
  }
  return (await res.json()) as OnchainMarketEntry
}

export interface ResolveMarketResult {
  kalshiTicker: string
  truthFunMarket: string
  fundedUsdc: number
  fundSig: string | null
  settleSig: string
  winningSide: 'yes' | 'no' | 'undecided'
}

export async function resolveOnchainMarket(opts: {
  kalshiTicker: string
  winningSide: 'yes' | 'no' | 'undecided'
  fundUsdc?: number
  /** Bypass wall-clock pre-flight in resolveMarket — used after time-travel. */
  skipCloseCheck?: boolean
}): Promise<ResolveMarketResult> {
  const res = await fetch(`${BACKEND_URL}/api/markets/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`backend ${res.status}: ${body.slice(0, 200)}`)
  }
  return (await res.json()) as ResolveMarketResult
}

/**
 * Surfpool-only: jump the on-chain Clock past `absoluteTimestamp` (Unix seconds).
 * Returns true on success, false on standard validators that don't implement
 * the surfnet_timeTravel RPC.
 */
export async function timeTravelChain(absoluteTimestamp: number): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/api/markets/time-travel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ absoluteTimestamp }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`backend ${res.status}: ${body.slice(0, 200)}`)
  }
  const body = (await res.json()) as { ok: boolean }
  return body.ok
}

// ─── PDA helpers (mirror backend's anchor-client.ts) ────────────────────────

function pda(
  seeds: (string | Buffer | PublicKey)[],
  programId: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    seeds.map((s) => {
      if (typeof s === 'string') return Buffer.from(s)
      if (Buffer.isBuffer(s)) return s
      return s.toBuffer()
    }),
    programId,
  )[0]
}

export const platformPda = (): PublicKey =>
  pda(['platform'], TRUTH_FUN_PROGRAM_ID)

export const usdcVaultPda = (market: PublicKey): PublicKey =>
  pda(['usdc_vault', market], TRUTH_FUN_PROGRAM_ID)

// ─── Anchor program helpers ─────────────────────────────────────────────────

function buildProvider(
  connection: Connection,
  wallet: WalletContextState,
): AnchorProvider {
  // Wallet adapter shape is compatible with Anchor's Wallet interface as long
  // as publicKey + signTransaction are present.
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter: any = {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions
      ? wallet.signAllTransactions.bind(wallet)
      : async (txs: Transaction[]) => {
          const signed: Transaction[] = []
          for (const tx of txs) signed.push(await wallet.signTransaction!(tx))
          return signed
        },
  }
  return new AnchorProvider(connection, adapter, { commitment: 'confirmed' })
}

function truthFunProgram(provider: AnchorProvider): Program {
  return new Program(truthFunIdl as Idl, provider)
}

// ─── Read helpers (legacy-compat for existing hooks) ────────────────────────

/**
 * Returns the YES bonding curve as a CurveState for the existing math helpers.
 *
 * x = curve_yes_supply (tokens, natural units)
 * y = (virtual_yes_reserve + curve_usdc_reserve) (USDC, natural units)
 * k = x * y
 *
 * Falls back to a 1200-token / 600-USDC seed shape if the backend can't
 * resolve the ticker (so the chart/preview math doesn't divide by zero).
 */
export async function getBondingCurveState(
  marketId: string,
): Promise<CurveState> {
  const snap = await fetchOnchainSnapshot(marketId).catch(() => null)
  if (!snap) return { x: 1200, y: 600, k: 720000 }
  const x = Number(BigInt(snap.curveYesSupply)) / D
  const y =
    (Number(BigInt(snap.virtualYesReserve)) +
      Number(BigInt(snap.curveUsdcReserve))) /
    D
  return { x, y, k: x * y }
}

export async function getNoCurveState(marketId: string): Promise<CurveState> {
  const snap = await fetchOnchainSnapshot(marketId).catch(() => null)
  if (!snap) return { x: 1200, y: 600, k: 720000 }
  const x = Number(BigInt(snap.curveNoSupply)) / D
  const y =
    (Number(BigInt(snap.virtualNoReserve)) +
      Number(BigInt(snap.curveNoReserve))) /
    D
  return { x, y, k: x * y }
}

export interface BonusPoolState {
  balance: number
  totalVolume: number
  winningTokensOutstanding: number
}

export async function getBonusPoolState(
  marketId: string,
): Promise<BonusPoolState> {
  const snap = await fetchOnchainSnapshot(marketId).catch(() => null)
  if (!snap) return { balance: 0, totalVolume: 0, winningTokensOutstanding: 1 }
  const balance = Number(BigInt(snap.bonusPoolUsdc)) / D
  // The contract doesn't expose lifetime volume directly; derive a lower bound
  // from realized USDC reserve (volume of buys that haven't been sold yet).
  const totalVolume =
    (Number(BigInt(snap.curveUsdcReserve)) +
      Number(BigInt(snap.curveNoReserve))) /
    D
  // Default to YES-side outstanding for display until resolution decides which side wins.
  const winningTokensOutstanding =
    Number(BigInt(snap.totalTfYesMinted)) / D || 1
  return { balance, totalVolume, winningTokensOutstanding }
}

// ─── Write helpers (real on-chain) ──────────────────────────────────────────

export type Side = 'YES' | 'NO'

interface CommonOpts {
  marketId: string
  wallet: WalletContextState
  connection: Connection
}

async function loadMarketEntry(marketId: string): Promise<OnchainMarketEntry> {
  // The backend caches the registry in-process; one fetch per call is fine.
  const list = await fetchOnchainMarkets()
  const found = list.find((m) => m.kalshiTicker === marketId)
  if (!found) {
    throw new Error(
      `Ticker "${marketId}" not registered on-chain. Ask the backend to create it first.`,
    )
  }
  return found
}

function tfMintFor(entry: OnchainMarketEntry, side: Side): PublicKey {
  return new PublicKey(side === 'YES' ? entry.tfYesMint : entry.tfNoMint)
}

async function ensureAtaIx(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
): Promise<{ address: PublicKey; needsCreate: boolean }> {
  const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID)
  const acct = await connection.getAccountInfo(ata)
  return { address: ata, needsCreate: !acct }
}

/**
 * Buy YES or NO on the curve via real Anchor tx. Returns the tx signature.
 *
 * Pre-creates the user's tfYES/NO ATA in the same tx if needed, so first-time
 * buyers don't get a "TokenAccountNotFoundError".
 */
export async function buyOnCurve(opts: CommonOpts & {
  side: Side
  usdcIn: number
  minTokensOut: number
}): Promise<string> {
  const { connection, wallet, marketId, side, usdcIn, minTokensOut } = opts
  if (!wallet.publicKey) throw new Error('Wallet not connected')

  const entry = await loadMarketEntry(marketId)
  const usdcMint = await fetchUsdcMint()
  const provider = buildProvider(connection, wallet)
  const program = truthFunProgram(provider)
  const truthMarketPk = new PublicKey(entry.truthFunMarket)
  const tfMint = tfMintFor(entry, side)
  const usdcVault = usdcVaultPda(truthMarketPk)
  const userUsdc = getAssociatedTokenAddressSync(
    usdcMint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  )
  const { address: userTf, needsCreate } = await ensureAtaIx(
    connection,
    wallet.publicKey,
    tfMint,
    wallet.publicKey,
  )

  const usdcInRaw = new BN(Math.floor(usdcIn * D))
  const minOutRaw = new BN(Math.floor(minTokensOut * D))

  const ixName = side === 'YES' ? 'buyYes' : 'buyNo'
  const accountsKey = side === 'YES' ? 'tfYesMint' : 'tfNoMint'
  const userTfKey = side === 'YES' ? 'userTfYes' : 'userTfNo'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let methodBuilder = (program.methods as any)
    [ixName](usdcInRaw, minOutRaw)
    .accountsPartial({
      user: wallet.publicKey,
      market: truthMarketPk,
      [accountsKey]: tfMint,
      usdcVault,
      userUsdc,
      [userTfKey]: userTf,
    })

  if (needsCreate) {
    methodBuilder = methodBuilder.preInstructions([
      createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        userTf,
        wallet.publicKey,
        tfMint,
      ),
    ])
  }

  const sig = await methodBuilder.rpc({ commitment: 'confirmed' })
  return sig as string
}

export async function sellOnCurve(opts: CommonOpts & {
  side: Side
  tokensIn: number
  minUsdcOut: number
}): Promise<string> {
  const { connection, wallet, marketId, side, tokensIn, minUsdcOut } = opts
  if (!wallet.publicKey) throw new Error('Wallet not connected')

  const entry = await loadMarketEntry(marketId)
  const usdcMint = await fetchUsdcMint()
  const provider = buildProvider(connection, wallet)
  const program = truthFunProgram(provider)
  const truthMarketPk = new PublicKey(entry.truthFunMarket)
  const tfMint = tfMintFor(entry, side)
  const usdcVault = usdcVaultPda(truthMarketPk)
  const userUsdc = getAssociatedTokenAddressSync(
    usdcMint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  )
  const userTf = getAssociatedTokenAddressSync(
    tfMint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  )

  const tokensInRaw = new BN(Math.floor(tokensIn * D))
  const minOutRaw = new BN(Math.floor(minUsdcOut * D))

  const ixName = side === 'YES' ? 'sellYes' : 'sellNo'
  const accountsKey = side === 'YES' ? 'tfYesMint' : 'tfNoMint'
  const userTfKey = side === 'YES' ? 'userTfYes' : 'userTfNo'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sig = await (program.methods as any)
    [ixName](tokensInRaw, minOutRaw)
    .accountsPartial({
      user: wallet.publicKey,
      market: truthMarketPk,
      [accountsKey]: tfMint,
      usdcVault,
      [userTfKey]: userTf,
      userUsdc,
    })
    .rpc({ commitment: 'confirmed' })
  return sig as string
}

export async function claimSidePayout(opts: CommonOpts & {
  side: Side
  amount: number
}): Promise<string> {
  const { connection, wallet, marketId, side, amount } = opts
  if (!wallet.publicKey) throw new Error('Wallet not connected')

  const entry = await loadMarketEntry(marketId)
  const usdcMint = await fetchUsdcMint()
  const provider = buildProvider(connection, wallet)
  const program = truthFunProgram(provider)
  const truthMarketPk = new PublicKey(entry.truthFunMarket)
  const tfMint = tfMintFor(entry, side)
  const usdcVault = usdcVaultPda(truthMarketPk)
  const userTf = getAssociatedTokenAddressSync(
    tfMint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  )
  const userUsdc = getAssociatedTokenAddressSync(
    usdcMint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  )

  const ixName = side === 'YES' ? 'claimPayout' : 'claimNoPayout'
  const tfMintKey = side === 'YES' ? 'tfYesMint' : 'tfNoMint'
  const userTfKey = side === 'YES' ? 'userTfYes' : 'userTfNo'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sig = await (program.methods as any)
    [ixName](new BN(Math.floor(amount * D)))
    .accountsPartial({
      user: wallet.publicKey,
      market: truthMarketPk,
      [tfMintKey]: tfMint,
      usdcVault,
      [userTfKey]: userTf,
      userUsdc,
    })
    .rpc({ commitment: 'confirmed' })
  return sig as string
}

// ─── USDC mint resolution ────────────────────────────────────────────────────

let _usdcMint: PublicKey | null = null

async function fetchUsdcMint(): Promise<PublicKey> {
  if (_usdcMint) return _usdcMint
  // Backend's /health doesn't expose it; pull from a dedicated endpoint or env.
  // For now, default to the standard devnet mint and allow env override.
  const fromEnv = process.env.NEXT_PUBLIC_USDC_MINT
  if (fromEnv) {
    _usdcMint = new PublicKey(fromEnv)
    return _usdcMint
  }
  // Fallback: hit a backend endpoint for the local mint.
  try {
    const res = await fetch(`${BACKEND_URL}/api/config/usdc-mint`)
    if (res.ok) {
      const body = (await res.json()) as { usdcMint: string }
      _usdcMint = new PublicKey(body.usdcMint)
      return _usdcMint
    }
  } catch {
    /* fall through */
  }
  // Final fallback: standard devnet USDC.
  _usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
  return _usdcMint
}

// Silence unused-symbol warnings when only some helpers are imported.
void pkFromEnv
