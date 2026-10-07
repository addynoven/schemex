import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-slate-200 bg-slate-100 text-slate-800',
        secondary: 'border-slate-200 bg-white text-slate-700',
        destructive: 'border-rose-200 bg-rose-50 text-rose-700',
        outline: 'border-slate-200 text-slate-600',
        emerald: 'border-emerald-200 bg-[#DCFCE7] text-[#166534]',
        amber: 'border-amber-200 bg-[#FEF3C7] text-[#92400E]',
        blue: 'border-sky-200 bg-[#E0F2FE] text-[#0369A1]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
