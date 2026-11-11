import * as React from 'react'
import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const NbInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-xl border-2 border-black dark:border-emerald-500/80 bg-[#FFFDF9] dark:bg-[#131F18] px-3.5 py-2 text-sm font-bold text-black dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] focus-visible:outline-none focus-visible:shadow-[3px_3px_0px_0px_#000000] disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        {...props}
      />
    )
  }
)
NbInput.displayName = 'NbInput'
