import type { ReactNode } from 'react'

export interface ConfirmationConfig {
  title?: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
}
