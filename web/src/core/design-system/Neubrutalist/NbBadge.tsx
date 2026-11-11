import * as React from 'react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface NbBadgeProps extends Omit<BadgeProps, 'variant'> {
  nbVariant?: 'default' | 'emerald' | 'amber' | 'rose' | 'sky' | 'outline'
}

export function NbBadge({
  className,
  nbVariant = 'default',
  ...props
}: NbBadgeProps) {
  const variantStyles = {
    default:
      'bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-white dark:border-emerald-500',
    emerald: 'bg-emerald-400 text-black',
    amber: 'bg-amber-400 text-black',
    rose: 'bg-rose-400 text-black',
    sky: 'bg-sky-400 text-black',
    outline:
      'bg-transparent text-black dark:text-white dark:border-emerald-500 shadow-none',
  }

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border-2 border-black font-black px-2.5 py-0.5 text-xs shadow-[2px_2px_0px_0px_#000000] select-none',
        variantStyles[nbVariant],
        className
      )}
      {...props}
    />
  )
}
NbBadge.displayName = 'NbBadge'
