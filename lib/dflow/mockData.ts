import type {
  TagsByCategories,
  Series,
  DFlowEvent,
  Market,
  Orderbook,
  Trade,
  PaginatedEvents,
} from './types'

export const MOCK_TAGS_BY_CATEGORIES: TagsByCategories = {
  'Politics': ['US Elections', 'International'],
  'Sports': ['NFL', 'NBA', 'Soccer'],
  'Finance': ['Crypto', 'Stocks'],
}

export const MOCK_SERIES: Series[] = [
  {
    ticker: 'KXBTCUSD-25DEC0313-T92749.99',
    title: 'Bitcoin Price',
    category: 'Finance',
    tags: ['Crypto'],
    frequency: 'daily',
    feeType: 'fixed',
    feeMultiplier: 0.05,
    settlementSources: [{ name: 'CoinGecko', url: 'https://coingecko.com' }],
    contractUrl: 'https://example.com',
    contractTermsUrl: 'https://example.com/terms',
  },
]

export const MOCK_EVENT: DFlowEvent = {
  ticker: 'KXBTCUSD-25DEC0313-T92749.99',
  seriesTicker: 'KXBTCUSD',
  title: 'Bitcoin Price',
  subtitle: 'Will BTC close above $100k?',
  competition: null,
  competitionScope: null,
  imageUrl: null,
  liquidity: 5000000,
  openInterest: 2500000,
  openInterestFp: '5000000',
  volume: 5000000,
  volumeFp: '5000000',
  volume24h: 150000,
  volume24hFp: '150000',
  strikeDate: Date.now() + 86400 * 30 * 1000,
  strikePeriod: '30d',
  settlementSources: null,
  markets: null,
}

export const MOCK_MARKET: Market = {
  ticker: 'KXBTCUSD-25DEC0313-T92749.99',
  eventTicker: 'KXBTCUSD-25DEC0313-T92749.99',
  marketType: 'BINARY',
  title: 'Bitcoin Price',
  subtitle: 'Will BTC close above $100k?',
  yesSubTitle: 'BTC > $100k',
  noSubTitle: 'BTC ≤ $100k',
  openTime: Date.now(),
  closeTime: Date.now() + 86400 * 30 * 1000,
  expirationTime: Date.now() + 86400 * 30 * 1000,
  status: 'active',
  result: '',
  volume: 2500000,
  openInterest: 1250000,
  canCloseEarly: false,
  earlyCloseCondition: null,
  rulesPrimary: 'Settlement based on Kalshi terms',
  rulesSecondary: null,
  yesAsk: '0.65',
  yesBid: '0.63',
  noAsk: '0.37',
  noBid: '0.35',
  volumeFp: '2500000',
  volume24hFp: '75000',
  openInterestFp: '1250000',
  fractionalTradingEnabled: false,
  accounts: {
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
      marketLedger: 'ledger_123',
      yesMint: 'yes_mint_123',
      noMint: 'no_mint_123',
      isInitialized: true,
      redemptionStatus: null,
      scalarOutcomePct: null,
    },
  },
}

export const MOCK_ORDERBOOK: Orderbook = {
  sequence: 12345,
  yes_bids: {
    '0.63': 1000,
    '0.62': 500,
    '0.65': 800,
    '0.66': 600,
  },
  no_bids: {
    '0.35': 1200,
    '0.34': 700,
    '0.37': 900,
    '0.38': 500,
  },
}

export const MOCK_TRADE: Trade = {
  tradeId: 'trade_123',
  ticker: 'KXBTCUSD-25DEC0313-T92749.99',
  price: 65,
  count: 100,
  yesPrice: 65,
  noPrice: 35,
  yesPriceDollars: '0.65',
  noPriceDollars: '0.35',
  takerSide: 'yes',
  createdTime: Date.now(),
}

export const MOCK_EVENTS: PaginatedEvents = {
  events: [MOCK_EVENT],
  cursor: null,
}

export function generateMockTrades(count: number = 10): Trade[] {
  const trades: Trade[] = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    trades.push({
      ...MOCK_TRADE,
      tradeId: `trade_${i}`,
      createdTime: now - i * 60 * 1000,
      count: Math.floor(Math.random() * 1000) + 100,
    })
  }
  return trades
}

export function generateMockPriceUpdate() {
  const baseYes = 0.5 + Math.random() * 0.3
  const baseNo = 1 - baseYes
  return {
    channel: 'prices' as const,
    type: 'ticker' as const,
    market_ticker: 'KXBTCUSD-25DEC0313-T92749.99',
    yes_bid: (baseYes - 0.01).toFixed(2),
    yes_ask: (baseYes + 0.01).toFixed(2),
    no_bid: (baseNo - 0.01).toFixed(2),
    no_ask: (baseNo + 0.01).toFixed(2),
  }
}
