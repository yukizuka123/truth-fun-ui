import { create } from 'zustand'

interface TruthFunStore {
  selectedMarketId: string | null
  setSelectedMarket: (id: string | null) => void
  isStubMode: boolean
  demoMode: boolean
  setDemoMode: (v: boolean) => void
  demoStep: number
  setDemoStep: (step: number) => void
}

export const useStore = create<TruthFunStore>((set) => ({
  selectedMarketId: null,
  setSelectedMarket: (id) => set({ selectedMarketId: id }),
  isStubMode: process.env.NEXT_PUBLIC_DFLOW_STUB === 'true',
  demoMode: false,
  setDemoMode: (v) => set({ demoMode: v }),
  demoStep: 0,
  setDemoStep: (step) => set({ demoStep: step }),
}))
