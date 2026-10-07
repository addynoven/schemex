'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, ShieldCheck, Compass, ArrowRight, Building2 } from 'lucide-react'

interface DiscoveryHeroBannerProps {
  onCheckEligibility?: () => void
}

export function DiscoveryHeroBanner({ onCheckEligibility }: DiscoveryHeroBannerProps) {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] text-xs font-bold">
          <ShieldCheck className="h-3.5 w-3.5 text-[#166534]" />
          Verified Directory · 4,148+ Government Schemes
        </div>

        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          All 36 States & UTs Covered
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
          Discover Welfare Benefits & Subsidies You Qualify For
        </h2>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Search verified government schemes across all Central Ministries and 28+ State Governments. Evaluate your live match score and required documents in seconds.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center gap-3">
        <Link
          href="/check"
          className="px-5 py-2.5 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Check My Eligibility (Instant)</span>
          <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
        </Link>

        <Link
          href="/vault"
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5"
        >
          <Compass className="h-4 w-4 text-[#0E6245]" />
          <span>Upload Vault Documents</span>
        </Link>
      </div>
    </div>
  )
}
