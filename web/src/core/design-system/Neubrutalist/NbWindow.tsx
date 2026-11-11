import * as React from 'react'
import { cn } from '@/lib/utils'

export const NbWindow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border-2 border-black dark:border-emerald-500/90 bg-[#FFFDF9] dark:bg-[#131F18] shadow-[5px_5px_0px_0px_#000000] dark:shadow-[5px_5px_0px_0px_#059669] overflow-hidden transition-all',
      className
    )}
    {...props}
  />
))
NbWindow.displayName = 'NbWindow'

export const NbWindowHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'h-9 px-3.5 bg-[#F4EFEA] dark:bg-[#0B120E] border-b-2 border-black dark:border-emerald-500/90 flex items-center justify-between select-none',
      className
    )}
    {...props}
  />
))
NbWindowHeader.displayName = 'NbWindowHeader'

export const NbWindowTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'font-mono text-xs font-black text-black dark:text-emerald-400 flex items-center gap-1.5',
      className
    )}
    {...props}
  />
))
NbWindowTitle.displayName = 'NbWindowTitle'

export const NbWindowClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      'h-5 w-5 rounded-md border-2 border-black dark:border-emerald-500 bg-[#FFFDF9] dark:bg-[#131F18] flex items-center justify-center text-[10px] font-black text-black dark:text-emerald-300 hover:bg-rose-400 dark:hover:bg-rose-600 hover:text-black cursor-pointer transition-colors',
      className
    )}
    {...props}
  >
    ✕
  </button>
))
NbWindowClose.displayName = 'NbWindowClose'

export const NbWindowContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 sm:p-6', className)} {...props} />
))
NbWindowContent.displayName = 'NbWindowContent'

export const NbWindowFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-4 py-2.5 bg-[#F4EFEA] dark:bg-[#0B120E] border-t-2 border-black dark:border-emerald-500/90 flex items-center justify-between',
      className
    )}
    {...props}
  />
))
NbWindowFooter.displayName = 'NbWindowFooter'
