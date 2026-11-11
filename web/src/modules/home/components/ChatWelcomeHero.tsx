'use client'

import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import {
  NbWindow,
  NbWindowHeader,
  NbWindowTitle,
  NbWindowClose,
  NbWindowContent,
  NbBadge,
  NbCard,
} from '@/core/design-system/Neubrutalist'

interface ChatWelcomeHeroProps {
  userName?: string
  onSelectSuggestion: (text: string) => void
}

const CITIZEN_SUGGESTIONS = [
  {
    category: 'Farmer Support',
    query: 'What schemes are available for small farmers in MP?',
  },
  {
    category: 'Direct Benefit Transfer',
    query: 'Check eligibility criteria for Ladli Behna Yojana',
  },
  {
    category: 'Housing & Shelter',
    query: 'How do I apply for PM Awas Yojana subsidy?',
  },
  {
    category: 'Higher Education',
    query: 'Are there scholarship schemes for OBC students?',
  },
]

export function ChatWelcomeHero({ userName, onSelectSuggestion }: ChatWelcomeHeroProps) {
  const cleanName = userName && userName !== 'Citizen' ? userName.split(' ')[0] : null

  return (
    <div className="flex flex-col items-center justify-center text-center px-2 py-8 sm:py-12 max-w-2xl mx-auto flex-1 font-sans animate-in fade-in duration-300">
      {/* Neubrutalist Main Window Card */}
      <NbWindow className="w-full max-w-xl text-left mb-6">
        <NbWindowHeader>
          <NbWindowTitle>:: Welfare Navigator</NbWindowTitle>
          <NbWindowClose />
        </NbWindowHeader>

        <NbWindowContent>
          <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight leading-snug mb-2">
            {cleanName ? `Hello, ${cleanName}.` : 'Hello, Citizen.'}
          </h2>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
            Autonomous Welfare Entitlement Advisor. Check eligibility, calculate DBT subsidies, and unlock 4,160+ verified central and state schemes.
          </p>

          {/* Neubrutal Tag Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            <NbBadge nbVariant="rose">Farmer Support</NbBadge>
            <NbBadge nbVariant="emerald">DBT Subsidies</NbBadge>
            <NbBadge nbVariant="amber">Housing</NbBadge>
            <NbBadge nbVariant="sky">Higher Education</NbBadge>
          </div>
        </NbWindowContent>
      </NbWindow>

      {/* Structured Query Suggestions */}
      <div className="w-full max-w-xl">
        <div className="text-left font-black text-xs uppercase tracking-wider text-black dark:text-emerald-400 mb-2 px-1">
          :: Prompt Suggestions
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {CITIZEN_SUGGESTIONS.map((s, idx) => (
            <NbCard
              key={idx}
              onClick={() => onSelectSuggestion(s.query)}
              className="group p-3.5 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000] dark:hover:shadow-[4px_4px_0px_0px_#10B981] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-120 cursor-pointer text-left flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-black text-black dark:text-emerald-400">
                  {s.category}
                </span>
                <ArrowUpRight className="h-4 w-4 text-black dark:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                {s.query}
              </p>
            </NbCard>
          ))}
        </div>
      </div>
    </div>
  )
}
