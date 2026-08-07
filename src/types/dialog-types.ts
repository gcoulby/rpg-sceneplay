import type { ReactNode } from 'react'

export interface ConfirmationConfig {
  title?: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
}

export interface PageSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export type RuleMeta = Record<
  string,
  { label: string; severity: 'grammar' | 'style'; description: string }
>

export type RuleSection = {
  blurb: string
  ids: readonly string[]
  meta: RuleMeta
}
