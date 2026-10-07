'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface SuggestionChipProps {
  icon?: LucideIcon
  label: string
  prompt: string
  onClick: (prompt: string) => void
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({
  icon: Icon,
  label,
  prompt,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(prompt)}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-[#0E6245] text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer text-left"
    >
      {Icon && <Icon className="h-3.5 w-3.5 text-[#0E6245] shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  )
}
