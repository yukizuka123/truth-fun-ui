import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { marketId } = body

  // Simulate arb execution log
  await new Promise((r) => setTimeout(r, 500))

  const steps = [
    { step: 1, message: 'Detecting spread between curve price and DFlow base...', ok: true },
    { step: 2, message: `Market: ${marketId ?? 'unknown'}`, ok: true },
    { step: 3, message: 'Checking Redemption Reserve oracle (TWAP, 5-min window)...', ok: true },
    { step: 4, message: 'Oracle fresh. Spread confirmed: +$0.29', ok: true },
    { step: 5, message: 'Executing Direction 1: buy 500 tfYES at DFlow ($0.62)...', ok: true },
    { step: 6, message: 'Deposit 500 tfYES to truth.fun bonding curve vault...', ok: true },
    { step: 7, message: 'Sell 500 tfYES into curve at $0.91...', ok: true },
    { step: 8, message: 'Arb profit: $116.00 (80% of $0.29 spread × 500 tokens)', ok: true },
    { step: 9, message: 'Protocol captures $29.00 → Bonus Pool', ok: true },
    { step: 10, message: 'Spread closed. Curve price now closer to DFlow base.', ok: true },
  ]

  return NextResponse.json({
    success: true,
    steps,
    summary: {
      direction: 1,
      spread: 0.29,
      tokens: 500,
      arbProfit: 116.0,
      bonusPoolContribution: 29.0,
      txSig: 'SimTx' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    },
  })
}
