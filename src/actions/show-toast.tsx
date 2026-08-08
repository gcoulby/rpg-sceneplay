import { toast } from '@/components/ui/toast'
import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react'

interface showToastProps {
  title?: string
  description: string
  type: string
  actionProps?:
    | Omit<
        DetailedHTMLProps<
          ButtonHTMLAttributes<HTMLButtonElement>,
          HTMLButtonElement
        >,
        'ref'
      >
    | undefined
}

export const showToast = ({
  title,
  description,
  type,
  actionProps,
}: showToastProps) => {
  return toast.add({
    title,
    description,
    type,
    actionProps,
  })
}
