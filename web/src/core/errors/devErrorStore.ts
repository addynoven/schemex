import { create } from 'zustand'

export interface DevErrorDetails {
  id?: string
  title: string
  errorCode?: string | null
  httpStatus?: number | null
  origin: 'Backend API' | 'Frontend Client' | 'SSE Stream'
  endpoint?: string
  message: string
  stackTrace?: string | null
  solution?: string | null
  rawPayload?: any
  timestamp: string
}

interface DevErrorState {
  isOpen: boolean
  activeError: DevErrorDetails | null
  errorHistory: DevErrorDetails[]
  openDevError: (error: DevErrorDetails) => void
  closeDevError: () => void
  clearHistory: () => void
}

export const useDevErrorStore = create<DevErrorState>((set) => ({
  isOpen: false,
  activeError: null,
  errorHistory: [],
  openDevError: (error: DevErrorDetails) =>
    set((state) => ({
      isOpen: true,
      activeError: error,
      errorHistory: [error, ...state.errorHistory.slice(0, 19)],
    })),
  closeDevError: () => set({ isOpen: false, activeError: null }),
  clearHistory: () => set({ errorHistory: [], activeError: null, isOpen: false }),
}))

export function captureDevError(error: Partial<DevErrorDetails>) {
  console.error('🚨 [Application Error]:', error.title, error.message, error)
}
