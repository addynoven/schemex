'use client'

import { Bot, Sparkles } from 'lucide-react'

interface ChatWelcomeHeroProps {
  userName: string
  onSelectSuggestion: (text: string) => void
}

const SUGGESTIONS = [
  'What schemes are available for small farmers in MP?',
  'Check eligibility for Ladli Behna Yojana',
  'How do I apply for PM Awas Yojana?',
  'Are there education scholarships for OBC students?',
]

export function ChatWelcomeHero({ userName, onSelectSuggestion }: ChatWelcomeHeroProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 sm:p-12 space-y-6 max-w-2xl mx-auto flex-1 animate-in fade-in duration-500 font-sans">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#DCFCE7] border border-[#BBF7D0] rounded-3xl text-[#0E6245] shadow-2xs flex items-center justify-center">
        <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-[#0E6245]" />
      </div>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Multilingual Civic Synthesis</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
          How can I assist you with government schemes today?
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto font-medium">
          Ask me in English, Hindi, or Kannada. I can verify your eligibility, find scholarships, check DBT statuses, and analyze required documents.
        </p>
      </div>

      <div className="w-full pt-6">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
          Or try a quick query
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(s)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0E6245]/40 hover:bg-[#F0FDF4] text-slate-700 hover:text-[#0E6245] text-[13px] font-bold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
