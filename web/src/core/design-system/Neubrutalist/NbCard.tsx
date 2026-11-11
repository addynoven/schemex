import * as React from 'react'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const NbCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      'rounded-2xl border-2 border-black dark:border-emerald-500/90 bg-[#FFFDF9] dark:bg-[#131F18] text-slate-900 dark:text-slate-100 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#059669] transition-all',
      className
    )}
    {...props}
  />
))
NbCard.displayName = 'NbCard'

export const NbCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 p-5 border-b-2 border-black dark:border-emerald-500/80',
      className
    )}
    {...props}
  />
))
NbCardHeader.displayName = 'NbCardHeader'

export const NbCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn(
      'font-black text-lg leading-tight text-black dark:text-white tracking-tight',
      className
    )}
    {...props}
  />
))
NbCardTitle.displayName = 'NbCardTitle'

export const NbCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <CardDescription
    ref={ref}
    className={cn(
      'text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed',
      className
    )}
    {...props}
  />
))
NbCardDescription.displayName = 'NbCardDescription'

export const NbCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent ref={ref} className={cn('p-5', className)} {...props} />
))
NbCardContent.displayName = 'NbCardContent'

export const NbCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardFooter
    ref={ref}
    className={cn('flex items-center p-5 pt-0', className)}
    {...props}
  />
))
NbCardFooter.displayName = 'NbCardFooter'
