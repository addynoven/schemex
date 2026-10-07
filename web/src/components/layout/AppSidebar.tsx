'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Compass,
  Sparkles,
  FolderLock,
  User as UserIcon,
  HelpCircle,
  PlusCircle,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/modules/auth'
import { homeRepository } from '@/modules/home/repositories'
import { type ChatSession, getCitizenUser, clearCitizenToken } from '@/core'

interface AppSidebarProps {
  currentSessionId?: number | string | null
  onSelectSession?: (id: number | string) => void
  onNewSession?: () => void
  onCloseMobileDrawer?: () => void
}

export function AppSidebar({
  currentSessionId,
  onSelectSession,
  onNewSession,
  onCloseMobileDrawer,
}: AppSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [mounted, setMounted] = useState(false)

  const isChatRoute = pathname === '/' || pathname?.startsWith('/c/')

  useEffect(() => {
    setMounted(true)
  }, [])

  const storedUser = mounted ? getCitizenUser() : null
  const activeUser = user || storedUser

  const handleLogout = () => {
    clearCitizenToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  useEffect(() => {
    homeRepository
      .listSessions()
      .then((data) => setSessions(data || []))
      .catch(() => {})
  }, [pathname, currentSessionId])

  const civicNavItems = [
    {
      href: '/',
      label: 'Chat (AI Advisor)',
      icon: <MessageSquare className="h-5 w-5" />,
      isActive: isChatRoute,
      badge: <span className="px-2 py-0.5 rounded-full bg-[#A4F1B2] text-[#24703E] font-bold text-[11px]">Live</span>,
    },
    {
      href: '/schemes',
      label: 'Schemes',
      icon: <Compass className="h-5 w-5" />,
      isActive: pathname?.startsWith('/schemes'),
      badge: <span className="px-2 py-0.5 rounded-full bg-[#E2E7FF] text-[#131B2E] font-mono font-bold text-[11px]">4148+</span>,
    },
    {
      href: '/check',
      label: 'Check (Wizard)',
      icon: <Sparkles className="h-5 w-5" />,
      isActive: pathname === '/check' || pathname === '/results',
      badge: <span className="px-2 py-0.5 rounded-full bg-[#A4F1B2] text-[#24703E] font-bold text-[11px]">Fast</span>,
    },
    {
      href: '/vault',
      label: 'Vault (Readiness)',
      icon: <FolderLock className="h-5 w-5" />,
      isActive: pathname === '/vault',
      badge: <span className="px-2 py-0.5 rounded-full bg-[#E2E7FF] text-[#131B2E] font-bold text-[11px]">Docs</span>,
    },
  ]

  const accountNavItems = [
    {
      href: '/profile',
      label: 'Profile',
      icon: <UserIcon className="h-5 w-5" />,
      isActive: pathname === '/profile',
    },
    {
      href: '/support',
      label: 'Support',
      icon: <HelpCircle className="h-5 w-5" />,
      isActive: pathname === '/support',
    },
  ]

  return (
    <aside className="w-72 h-screen bg-white z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] font-sans fixed lg:static left-0 top-0 border-r border-slate-200">
      <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none">

        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center gap-2.5 bg-white shrink-0">
          <img
            alt="Scheme AI Logo"
            src="/icon.png"
            className="h-8 w-8 object-contain rounded-xl bg-[#0E6245] p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%230E6245"><path d="M11 20A7 7 0 0 1 4 13v-5l7-3 7 3v5a7 7 0 0 1-7 7Z"/></svg>';
            }}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-black text-[#0E6245] text-base tracking-tight truncate">
              Scheme AI
            </span>
            <span className="font-bold text-[11px] text-slate-500 truncate">
              Citizen Welfare Navigator
            </span>
          </div>
        </div>

        {/* Triple Color Band Decorator */}
        <div className="h-1 w-full bg-[#E2E7FF] flex shrink-0">
          <div className="w-1/3 bg-[#8F3E0C]"></div>
          <div className="w-1/3 bg-white"></div>
          <div className="w-1/3 bg-[#0E6245]"></div>
        </div>

        {/* Primary Navigation Sections */}
        <div className="p-4 flex flex-col flex-1 min-h-0 space-y-6">

          {/* Civic Services */}
          <div className="shrink-0">
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 px-2 pb-1">
              Civic Services
            </div>
            <nav className="flex flex-col gap-1">
              {civicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobileDrawer}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                    item.isActive
                      ? 'bg-[#0E6245] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-[#F2F3FF] hover:text-slate-900 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={item.isActive ? 'text-white' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span className="text-[13px]">{item.label}</span>
                  </div>
                  {item.badge}
                </Link>
              ))}
            </nav>
          </div>

          {/* Account & Assistance */}
          <div className="shrink-0">
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 px-2 pt-2 pb-1">
              Account & Assistance
            </div>
            <nav className="flex flex-col gap-1">
              {accountNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobileDrawer}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    item.isActive
                      ? 'bg-[#0E6245] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-[#F2F3FF] hover:text-slate-900 font-semibold'
                  }`}
                >
                  <span className={item.isActive ? 'text-white' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="text-[13px]">{item.label}</span>
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-all text-left w-full cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-[13px]">Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Consultation History (If active) - Expands to fill available space */}
          {sessions.length > 0 && (
            <div className="pt-2 border-t border-slate-200 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between px-2 pb-2 shrink-0">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Recent Queries
                </span>
                <span className="font-mono text-[10px] text-[#0E6245] font-bold">
                  {sessions.length} Recorded
                </span>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
                {sessions.map((s) => {
                  const isSelected = currentSessionId === s.id || currentSessionId === s.session_uid;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (onSelectSession) {
                          onSelectSession(s.session_uid || s.id);
                        } else {
                          window.location.href = `/c/${s.session_uid || s.id}`;
                        }
                        onCloseMobileDrawer?.();
                      }}
                      className={`text-left p-2.5 rounded-xl transition-all flex flex-col gap-1 shrink-0 ${
                        isSelected
                          ? 'bg-[#F2F3FF] border-l-4 border-[#0E6245]'
                          : 'hover:bg-[#F2F3FF]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {s.title || `Consultation #${s.id}`}
                        </span>
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#1F6C3A] shrink-0 mt-1 animate-pulse" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-slate-500">
                          {isSelected ? 'Active Now' : 'Archived'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isSelected ? 'bg-[#A4F1B2] text-[#24703E]' : 'bg-[#E2E7FF] text-slate-600'
                        }`}>
                          {isSelected ? 'Active' : 'Completed'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* New Consultation Fixed Button Area */}
      {onNewSession && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              onNewSession();
              onCloseMobileDrawer?.();
            }}
            className="w-full bg-[#0E6245] text-white hover:bg-[#004831] font-bold text-[13px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Advisory Session</span>
          </button>
        </div>
      )}
    </aside>
  )
}
