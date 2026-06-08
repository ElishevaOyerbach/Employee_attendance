import { createContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

export interface ToastContextValue {
  /** Show a toast; returns its id. */
  notify: (message: string, tone?: ToastTone) => number
  success: (message: string) => number
  error: (message: string) => number
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)
