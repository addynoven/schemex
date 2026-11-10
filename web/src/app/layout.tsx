import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider, ErrorBoundary, ThemeProvider } from '@/core'

export const metadata: Metadata = {
  title: 'Scheme AI — Government Welfare Navigator',
  description: 'AI-Powered Citizen Welfare Navigator & Sovereign Eligibility Engine',
}

const themeInitScript = `
  try {
    const stored = localStorage.getItem('scheme-theme');
    const isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-slate-50 dark:bg-[#070e0a] text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-100 selection:text-emerald-900 dark:selection:bg-[#0e6245] dark:selection:text-white min-h-screen">
        <ThemeProvider>
          <QueryProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
