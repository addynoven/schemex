import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider, ErrorBoundary } from '@/core'

export const metadata: Metadata = {
  title: 'Scheme AI — Government Welfare Navigator',
  description: 'AI-Powered Citizen Welfare Navigator & Sovereign Eligibility Engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 min-h-screen">
        <QueryProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  )
}
