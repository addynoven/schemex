import * as React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface NbButtonProps extends ButtonProps {
  nbVariant?: 'primary' | 'outline' | 'secondary' | 'destructive' | 'activeTab' | 'ghost'
}

export const NbButton = React.forwardRef<HTMLButtonElement, NbButtonProps>(
  ({ className, nbVariant = 'primary', ...props }, ref) => {
    const variantStyles = {
      primary:
        'bg-emerald-400 dark:bg-emerald-500 text-black border-2 border-black shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      outline:
        'bg-[#FFFDF9] dark:bg-[#131F18] text-black dark:text-white border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000000] dark:hover:shadow-[3px_3px_0px_0px_#10B981] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
      secondary:
        'bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-emerald-300 border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
      destructive:
        'bg-rose-400 dark:bg-rose-600 text-black dark:text-white border-2 border-black shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      activeTab:
        'bg-emerald-400 dark:bg-emerald-500 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] translate-x-[-1px] translate-y-[-1px]',
      ghost:
        'bg-transparent text-black/70 dark:text-white/70 border-2 border-transparent hover:border-black/20 dark:hover:border-emerald-500/30 hover:bg-black/5 dark:hover:bg-white/5 shadow-none',
    }

    return (
      <Button
        ref={ref}
        className={cn(
          'font-black rounded-xl transition-all cursor-pointer select-none',
          variantStyles[nbVariant],
          className
        )}
        {...props}
      />
    )
  }
)
NbButton.displayName = 'NbButton'
