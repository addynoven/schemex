'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Menu, X, Leaf, Search, Bell, User as UserIcon } from 'lucide-react'
import { AppSidebar } from './AppSidebar'
import { getCitizenUser } from '@/lib/session'

interface AppLayoutProps {
  children: React.ReactNode
  currentSessionId?: number | string | null
  onSelectSession?: (id: number | string) => void
  onNewSession?: () => void
}

export function AppLayout({
  children,
  currentSessionId,
  onSelectSession,
  onNewSession,
}: AppLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const q = searchParams?.get('q') || searchParams?.get('search') || ''
    if (q) {
      setSearchQuery(q)
    }
  }, [searchParams])

  const activeUser = mounted ? getCitizenUser() : null

  const userEmail = mounted && activeUser?.email ? activeUser.email : 'citizen.user@example.com'
  const userName =
    mounted && activeUser
      ? activeUser?.profile?.full_name ||
        activeUser?.full_name ||
        activeUser?.displayName ||
        (activeUser?.email ? activeUser.email.split('@')[0] : 'Citizen User')
      : 'Citizen User'

  const userAvatar = mounted
    ? activeUser?.avatar_url ||
      activeUser?.photoURL ||
      activeUser?.profile?.avatar_url
    : undefined

  const citizenUid = mounted && activeUser?.citizen_uid ? activeUser.citizen_uid : 'IN-8849-KA'

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/schemes?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <AppSidebar
          currentSessionId={currentSessionId}
          onSelectSession={onSelectSession}
          onNewSession={onNewSession}
        />
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-10 w-72 h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="absolute right-3 top-3 z-20">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AppSidebar
              currentSessionId={currentSessionId}
              onSelectSession={onSelectSession}
              onNewSession={onNewSession}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
        {/* Global Top Header (Mobile + Desktop Parity) */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40">

          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schemes by ministry, state, or benefit keywords..."
                className="w-full h-10 pl-10 pr-4 bg-[#F2F3FF] rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0E6245]"
              />
            </form>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4 shrink-0 pl-4">

            {/* S3 Security Badge (Hidden on very small screens) */}
            <div className="hidden xl:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F2F3FF]">
              <span className="h-2 w-2 rounded-full bg-[#1F6C3A] animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-slate-500">S3 Encrypted • 256-bit Secure</span>
            </div>

            {/* Notifications Bell */}
            <button
              type="button"
              className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-[#F2F3FF] hover:text-slate-900 transition-colors relative cursor-pointer shrink-0"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-600 border border-white" />
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* User Profile Block */}
            <Link href="/profile" className="flex items-center gap-3 pl-1 sm:pl-2 hover:opacity-80 transition-opacity">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[13px] font-bold text-slate-900">{userName}</span>
                <span className="text-[11px] font-mono font-semibold text-slate-500">{citizenUid}</span>
              </div>

              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#166534] font-black text-xs shrink-0 uppercase">
                  {userName ? userName.charAt(0) : <UserIcon className="h-4 w-4 text-[#0E6245]" />}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page Body View */}
        <main className="flex-1 overflow-y-auto relative">{children}</main>
      </div>
    </div>
  )
}
