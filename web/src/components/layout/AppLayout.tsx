'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Menu, X, Search, Bell, User as UserIcon } from 'lucide-react'
import { AppSidebar } from './AppSidebar'
import { getCitizenUser, saveCitizenUser } from '@/lib/session'
import { citizenGetMe } from '@/lib/api'
import { ThemeToggle } from '@/core'
import { NbInput, NbButton } from '@/core/design-system/Neubrutalist'

interface AppLayoutProps {
  children: React.ReactNode
  currentSessionId?: number | string | null
  onSelectSession?: (id: number | string) => void
  onNewSession?: () => void
}

function TopbarSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const q = searchParams?.get('q') || searchParams?.get('search') || ''
    if (q) {
      setSearchQuery(q)
    }
  }, [searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/schemes?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 dark:text-emerald-400 pointer-events-none z-10" />
      <NbInput
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search schemes by ministry, state, or benefit keywords..."
        className="pl-10"
      />
    </form>
  )
}

export function AppLayout({
  children,
  currentSessionId,
  onSelectSession,
  onNewSession,
}: AppLayoutProps) {
  const router = useRouter()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    const local = getCitizenUser()
    if (local) {
      setUser(local)
    }

    citizenGetMe()
      .then((data) => {
        setUser(data)
        saveCitizenUser(data)
      })
      .catch(() => {
        if (!local && typeof window !== 'undefined') {
          router.push('/login')
        }
      })
  }, [router])

  const userName =
    user?.profile?.full_name ||
    user?.full_name ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'Citizen')

  const userAvatar =
    user?.avatar_url ||
    user?.photoURL ||
    user?.profile?.avatar_url ||
    undefined

  const citizenUid = user?.citizen_uid || ''

  return (
    <div className="flex h-screen bg-transparent text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
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
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-10 w-72 h-full bg-[#FFFDF9] dark:bg-[#131F18] border-r-2 border-black dark:border-emerald-500/80 shadow-[6px_0px_0px_0px_#000000] dark:shadow-[6px_0px_0px_0px_#059669] flex flex-col animate-in slide-in-from-left duration-200">
            <div className="absolute right-3 top-3 z-20">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl border-2 border-black dark:border-emerald-500 bg-[#F4EFEA] dark:bg-[#0B120E] text-slate-900 dark:text-slate-100 hover:translate-x-0.5 hover:translate-y-0.5 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] cursor-pointer"
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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        {/* Global Top Header (Neubrutal Window Bar) */}
        <header className="h-16 bg-[#FFFDF9] dark:bg-[#131F18] border-b-2 border-black dark:border-emerald-500/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-40 transition-colors">

          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 border-2 border-black dark:border-emerald-500 bg-[#F4EFEA] dark:bg-[#0B120E] text-slate-900 dark:text-slate-100 rounded-xl cursor-pointer shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Bar */}
            <Suspense fallback={
              <div className="w-full h-10 bg-slate-200 dark:bg-emerald-950/40 rounded-xl animate-pulse" />
            }>
              <TopbarSearchBar />
            </Suspense>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-4">

            {/* Theme Switcher Toggle */}
            <ThemeToggle />

            {/* Notifications Bell */}
            <NbButton
              type="button"
              nbVariant="outline"
              size="icon"
              className="relative shrink-0"
              title="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border border-black" />
            </NbButton>

            {/* Divider */}
            <div className="h-8 w-0.5 bg-black dark:bg-emerald-500/80 hidden sm:block" />

            {/* User Profile Block */}
            <Link href="/profile" className="flex items-center gap-3 pl-1 sm:pl-2 group hover:opacity-90 transition-opacity">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[13px] font-black text-slate-900 dark:text-slate-100">{userName}</span>
                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-emerald-400">{citizenUid}</span>
              </div>

              {userAvatar && !avatarError ? (
                <img
                  src={userAvatar}
                  alt="Profile"
                  onError={() => setAvatarError(true)}
                  className="h-9 w-9 rounded-xl object-cover border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-emerald-400 dark:bg-emerald-900 border-2 border-black dark:border-emerald-400 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] flex items-center justify-center text-black dark:text-emerald-100 font-black text-xs shrink-0 uppercase">
                  {userName ? userName.charAt(0) : <UserIcon className="h-4 w-4 text-black dark:text-white" />}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page Body View */}
        <main className="flex-1 overflow-y-auto relative bg-transparent">{children}</main>
      </div>
    </div>
  )
}
