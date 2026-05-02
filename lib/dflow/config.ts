export type DFlowEnv = 'dev' | 'prod'

const ENV = (process.env.NEXT_PUBLIC_DFLOW_ENV ?? 'dev') as DFlowEnv

const ENDPOINTS = {
  dev: {
    metadata: 'https://dev-prediction-markets-api.dflow.net',
    metadataWs: 'wss://dev-prediction-markets-api.dflow.net/api/v1/ws',
  },
  prod: {
    metadata: 'https://prediction-markets-api.dflow.net',
    metadataWs: 'wss://prediction-markets-api.dflow.net/api/v1/ws',
  },
}

export const DFLOW = {
  env: ENV,
  ...ENDPOINTS[ENV],
}

export const TRADE_API_BASE = {
  dev: 'https://dev-quote-api.dflow.net',
  prod: 'https://quote-api.dflow.net',
}[ENV]

export const DFLOW_API_KEY = process.env.DFLOW_API_KEY ?? ''

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
export const USDC_DECIMALS = 6
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
