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
import { homeRepository } from '@/modules/home/repositories'
import { type ChatSession, clearCitizenToken } from '@/core'
import { NbButton } from '@/core/design-system/Neubrutalist'

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
  const [sessions, setSessions] = useState<ChatSession[]>([])

  const isChatRoute = pathname === '/' || pathname?.startsWith('/c/')

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
      icon: <MessageSquare className="h-4.5 w-4.5" />,
      isActive: isChatRoute,
    },
    {
      href: '/schemes',
      label: 'Schemes',
      icon: <Compass className="h-4.5 w-4.5" />,
      isActive: pathname?.startsWith('/schemes'),
    },
    {
      href: '/check',
      label: 'Check (Wizard)',
      icon: <Sparkles className="h-4.5 w-4.5" />,
      isActive: pathname === '/check' || pathname === '/results',
    },
    {
      href: '/vault',
      label: 'Vault (Readiness)',
      icon: <FolderLock className="h-4.5 w-4.5" />,
      isActive: pathname === '/vault',
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
    <aside className="w-72 h-screen bg-[#FFFDF9] dark:bg-[#131F18] z-50 flex flex-col justify-between font-sans fixed lg:static left-0 top-0 border-r-2 border-black dark:border-emerald-500/80 shadow-[4px_0px_0px_0px_#000000] dark:shadow-[4px_0px_0px_0px_#059669] transition-colors duration-150">
      <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none">

        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center gap-2.5 bg-[#FFFDF9] dark:bg-[#131F18] shrink-0 border-b-2 border-black dark:border-emerald-500/80">
          <img
            alt="Scheme AI Logo"
            src="/icon.png"
            className="h-8 w-8 object-contain rounded-xl bg-emerald-500 p-1 border-2 border-black shadow-[2px_2px_0px_0px_#000000]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%230E6245"><path d="M11 20A7 7 0 0 1 4 13v-5l7-3 7 3v5a7 7 0 0 1-7 7Z"/></svg>';
            }}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-black text-black dark:text-white text-base tracking-tight truncate">
              Scheme Navigator
            </span>
            <span className="font-bold text-[11px] text-slate-600 dark:text-emerald-400 truncate">
              :: Civic Welfare System
            </span>
          </div>
        </div>

        {/* Primary Navigation Sections */}
        <div className="p-4 flex flex-col flex-1 min-h-0 space-y-6">

          {/* Civic Services */}
          <div className="shrink-0">
            <div className="font-black text-[11px] uppercase tracking-wider text-black dark:text-emerald-300 px-2 pb-1.5 flex items-center gap-1.5">
              <span>:: Services</span>
            </div>
            <nav className="flex flex-col gap-1.5">
              {civicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobileDrawer}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all ${
                    item.isActive
                      ? 'bg-emerald-400 dark:bg-emerald-500 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] translate-x-[-1px] translate-y-[-1px]'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-[#F4EFEA] dark:hover:bg-[#1A2820] hover:text-black dark:hover:text-white font-bold border-2 border-transparent hover:border-black dark:hover:border-emerald-500/60'
                  }`}
                >
                  <span className={item.isActive ? 'text-black' : 'text-slate-700 dark:text-slate-300'}>
                    {item.icon}
                  </span>
                  <span className="text-[13px]">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Account & Assistance */}
          <div className="shrink-0">
            <div className="font-black text-[11px] uppercase tracking-wider text-black dark:text-emerald-300 px-2 pt-2 pb-1.5 flex items-center gap-1.5">
              <span>:: Account</span>
            </div>
            <nav className="flex flex-col gap-1.5">
              {accountNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobileDrawer}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all ${
                    item.isActive
                      ? 'bg-emerald-400 dark:bg-emerald-500 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] translate-x-[-1px] translate-y-[-1px]'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-[#F4EFEA] dark:hover:bg-[#1A2820] hover:text-black dark:hover:text-white font-bold border-2 border-transparent hover:border-black dark:hover:border-emerald-500/60'
                  }`}
                >
                  <span className={item.isActive ? 'text-black' : 'text-slate-700 dark:text-slate-300'}>
                    {item.icon}
                  </span>
                  <span className="text-[13px]">{item.label}</span>
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 font-bold border-2 border-transparent hover:border-black dark:hover:border-rose-700 transition-all text-left w-full cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-[13px]">Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Consultation History (If active) - Expands to fill available space */}
          {sessions.length > 0 && (
            <div className="pt-2 border-t-2 border-black dark:border-emerald-500/80 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between px-2 pb-2 shrink-0">
                <span className="font-black text-[11px] uppercase tracking-wider text-black dark:text-emerald-300">
                  :: History
                </span>
                <span className="font-mono text-[10px] text-black dark:text-emerald-400 font-black px-1.5 py-0.5 rounded-md border border-black dark:border-emerald-500 bg-[#F4EFEA] dark:bg-[#0B120E]">
                  {sessions.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
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
                          ? 'bg-[#FFFDF9] dark:bg-[#1A2820] border-2 border-black dark:border-emerald-400 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669]'
                          : 'bg-transparent border-2 border-transparent hover:border-black dark:hover:border-emerald-800/60 hover:bg-[#F4EFEA] dark:hover:bg-[#15231B]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-black line-clamp-1 ${isSelected ? 'text-black dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                          {s.title || `Consultation #${s.id}`}
                        </span>
                        {isSelected && <span className="h-2 w-2 rounded-full bg-emerald-500 border border-black shrink-0 mt-0.5" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                          {isSelected ? 'Active' : 'Saved'}
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
        <div className="p-4 border-t-2 border-black dark:border-emerald-500/80 bg-[#FFFDF9] dark:bg-[#131F18]">
          <NbButton
            onClick={() => {
              onNewSession();
              onCloseMobileDrawer?.();
            }}
            nbVariant="primary"
            className="w-full h-11 text-[13px] flex items-center justify-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Consultation</span>
          </NbButton>
        </div>
      )}
    </aside>
  )
}
