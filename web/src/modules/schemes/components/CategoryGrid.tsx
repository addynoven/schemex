'use client'

import React from 'react'
import {
  Wheat,
  GraduationCap,
  HeartPulse,
  Users,
  Briefcase,
  Home,
  Layers,
  FolderOpen,
  Sparkles,
} from 'lucide-react'

interface CategoryItem {
  id: string
  title: string
  count: number
  icon: React.ReactNode
  badgeBg: string
  badgeText: string
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'All',
    title: 'All Categories',
    count: 4148,
    icon: <Layers className="h-5 w-5 text-[#0E6245]" />,
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-[#166534]',
  },
  {
    id: 'Agriculture',
    title: 'Agriculture & Farmers',
    count: 802,
    icon: <Wheat className="h-5 w-5 text-emerald-700" />,
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-800',
  },
  {
    id: 'Education',
    title: 'Education & Scholarships',
    count: 668,
    icon: <GraduationCap className="h-5 w-5 text-purple-600" />,
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-800',
  },
  {
    id: 'Healthcare',
    title: 'Healthcare & Insurance',
    count: 446,
    icon: <HeartPulse className="h-5 w-5 text-rose-600" />,
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-800',
  },
  {
    id: 'Women & Child',
    title: 'Women & Child Welfare',
    count: 545,
    icon: <Users className="h-5 w-5 text-pink-600" />,
    badgeBg: 'bg-pink-50 border-pink-200',
    badgeText: 'text-pink-800',
  },
  {
    id: 'Business & Finance',
    title: 'Business & Mudra MSME',
    count: 305,
    icon: <Briefcase className="h-5 w-5 text-sky-600" />,
    badgeBg: 'bg-sky-50 border-sky-200',
    badgeText: 'text-sky-800',
  },
  {
    id: 'Housing',
    title: 'Housing & Urban Awas',
    count: 312,
    icon: <Home className="h-5 w-5 text-teal-600" />,
    badgeBg: 'bg-teal-50 border-teal-200',
    badgeText: 'text-teal-800',
  },
  {
    id: 'Social Welfare',
    title: 'Social Security & Pension',
    count: 429,
    icon: <Sparkles className="h-5 w-5 text-amber-600" />,
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800',
  },
]

interface CategoryGridProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export function CategoryGrid({ selectedCategory, onSelectCategory }: CategoryGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Browse by Welfare Sector
        </h3>
        <span className="text-[11px] text-slate-500 font-medium">Click category card to filter</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-[#0E6245] text-white border-[#0E6245] shadow-sm'
                  : `${cat.badgeBg} hover:border-[#0E6245]/40 text-slate-900`
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-white shadow-2xs'}`}>
                  {cat.icon}
                </div>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border ${
                    isSelected
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {cat.count}
                </span>
              </div>

              <div>
                <span
                  className={`text-xs font-bold leading-snug line-clamp-1 block ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {cat.title}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
