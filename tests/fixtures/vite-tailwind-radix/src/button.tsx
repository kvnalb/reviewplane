import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }

export function Button({ asChild = false, className = '', ...props }: Props) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={`inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm text-white ${className}`} {...props} />
}
