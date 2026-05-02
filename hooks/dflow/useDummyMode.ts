'use client'

export function useDummyMode(): boolean {
  return process.env.NEXT_PUBLIC_DFLOW_STUB === 'true'
}
