import { Suspense } from 'react'
import { SchemesBrowseScreen } from '@/modules/schemes'

export const metadata = {
  title: 'Browse Government Schemes | Scheme Navigator',
  description: 'Search, filter, and discover over 4,100+ Central and State welfare initiatives and citizen subsidies.',
}

export default function SchemesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 font-sans font-semibold text-xs gap-3">
          <div className="h-5 w-5 border-2 border-[#0E6245]/20 border-t-[#0E6245] rounded-full animate-spin" />
          <span>Loading schemes directory...</span>
        </div>
      }
    >
      <SchemesBrowseScreen />
    </Suspense>
  )
}
