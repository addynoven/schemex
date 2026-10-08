'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Search,
  FolderLock,
  HelpCircle,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Edit2,
  Trash2,
  Check,
  X,
  LogOut,
  Shield,
  Sparkles,
} from 'lucide-react'
import type { ChatSession } from '@/types'
import { updateChatSessionTitle, deleteChatSession } from '@/core'

interface AppSidebarProps {
  isOpen: boolean
  setIsOpen: (val: boolean) => void
  sessions: ChatSession[]
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>
  activeSessionId: number | null
  userName: string | null
  userProfile: any | null
  citizenUid: string | null
  householdUid?: string | null
  onNewChat: () => void
  onLogout: () => void
  currentPath: string
}

export function AppSidebar({
  isOpen,
  setIsOpen,
  sessions,
  setSessions,
  activeSessionId,
  userName,
  userProfile,
  citizenUid,
  onNewChat,
  onLogout,
  currentPath,
}: AppSidebarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingSessionId(session.id)
    setEditingTitle(session.title || 'Welfare conversation')
  }

  const handleSaveRename = async (id: number, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const cleanTitle = editingTitle.trim()
    if (!cleanTitle) {
      setEditingSessionId(null)
      return
    }
    try {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: cleanTitle } : s)))
      setEditingSessionId(null)
      await updateChatSessionTitle(id, cleanTitle)
      window.dispatchEvent(new CustomEvent('scheme:session-updated'))
    } catch (err) {
      console.error('Failed to rename session:', err)
    }
  }

  const handleCancelRename = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingSessionId(null)
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const remaining = sessions.filter((s) => s.id !== id)
      setSessions(remaining)
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          router.push(`/?session=${remaining[0].id}`)
        } else {
          router.push('/')
        }
      }
      await deleteChatSession(id)
      window.dispatchEvent(new CustomEvent('scheme:session-updated'))
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const navItems = [
    { label: 'Chat', href: '/', icon: MessageSquare, active: currentPath === '/' && !activeSessionId },
    { label: 'Browse Schemes', href: '/schemes', icon: Search, active: currentPath.startsWith('/schemes') },
    { label: 'Eligibility Check', href: '/check', icon: Sparkles, active: currentPath === '/check' },
    { label: 'Document Vault', href: '/vault', icon: FolderLock, active: currentPath === '/vault' },
    { label: 'Help & Support', href: '/support', icon: HelpCircle, active: currentPath === '/support' },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-zinc-800/70 bg-[#0f0f12] transition-all duration-200 ease-in-out ${
          isOpen ? 'w-64 sm:w-68' : 'w-14 hidden lg:flex'
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col p-3 space-y-3 overflow-hidden flex-1">
          {/* Header Row */}
          <div className="flex items-center justify-between px-1 h-8 shrink-0">
            {isOpen ? (
              <Link href="/" className="flex items-center gap-2 group">
                <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-blue-400 shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-sm text-zinc-100 tracking-tight leading-none">Scheme AI</span>
                  <span className="text-[10px] text-zinc-500 font-normal mt-0.5">Government assistant</span>
                </div>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="h-8 w-8 mx-auto rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}

            {isOpen && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* New Chat Primary Action */}
          {isOpen ? (
            <button
              type="button"
              onClick={onNewChat}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 text-zinc-200 hover:text-white font-medium text-xs shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5 text-zinc-300" />
                <span>New Chat</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">⌘K</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewChat}
              className="h-8 w-8 mx-auto rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          {/* Primary Navigation Items */}
          <nav className="flex flex-col space-y-0.5 pt-1 border-t border-zinc-800/50 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) setIsOpen(false)
                  }}
                  className={`flex items-center rounded-lg text-xs transition-colors ${
                    item.active
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  } ${isOpen ? 'gap-2.5 px-2.5 py-1.5' : 'justify-center h-8 w-8 mx-auto'}`}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Recent Conversations */}
          {isOpen && (
            <div className="flex-1 flex flex-col pt-2 border-t border-zinc-800/50 overflow-hidden min-h-0">
              <div className="mb-2 shrink-0">
                <div className="relative">
                  <Search className="h-3 w-3 absolute left-2.5 top-2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full bg-zinc-900/60 border border-zinc-800/70 rounded-lg pl-7 pr-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <span className="px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 block mb-1 shrink-0">
                Recent Chats
              </span>

              <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
                {filteredSessions.length === 0 ? (
                  <div className="px-2 py-3 text-[11px] text-zinc-500 italic">No conversations</div>
                ) : (
                  filteredSessions.map((s) => {
                    const isActive = activeSessionId === s.id
                    const isEditing = editingSessionId === s.id

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (!isEditing) {
                            router.push(`/?session=${s.id}`)
                            if (window.innerWidth < 1024) setIsOpen(false)
                          }
                        }}
                        className={`group relative rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer text-xs transition-all ${
                          isActive
                            ? 'bg-zinc-800 text-white font-medium'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                        }`}
                      >
                        <span className="truncate flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              type="text"
                              autoFocus
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(s.id, e)
                                if (e.key === 'Escape') setEditingSessionId(null)
                              }}
                              className="bg-zinc-950 border border-zinc-600 text-xs text-white rounded px-1.5 py-0.5 w-full focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          ) : (
                            s.title || 'Welfare conversation'
                          )}
                        </span>

                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleSaveRename(s.id, e)}
                                className="p-1 hover:text-emerald-400 text-zinc-400 rounded hover:bg-zinc-700/50 cursor-pointer"
                                title="Save title"
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelRename}
                                className="p-1 hover:text-red-400 text-zinc-400 rounded hover:bg-zinc-700/50 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5 text-zinc-400" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleStartRename(s, e)}
                                className="p-1 hover:text-zinc-100 text-zinc-500 rounded hover:bg-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Rename conversation"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(s.id, e)}
                                className="p-1 hover:text-red-400 text-zinc-500 rounded hover:bg-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Delete conversation"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Profile Row */}
        <div className="p-2 border-t border-zinc-800/60 bg-[#0c0c0e] shrink-0">
          {isOpen ? (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg">
              <Link href="/profile" className="flex items-center gap-2 truncate flex-1 min-w-0 group">
                <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 text-xs font-semibold shrink-0">
                  {(userName || 'C')[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col text-left truncate flex-1 min-w-0">
                  <span className="text-xs font-medium text-zinc-200 truncate group-hover:text-white">{userName}</span>
                  <span className="text-[10px] text-zinc-500 truncate">
                    {userProfile ? `${userProfile.state}` : `${citizenUid || 'Verified'}`}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/profile"
              className="h-8 w-8 mx-auto rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 text-xs font-semibold"
              title="Citizen Profile"
            >
              {(userName || 'C')[0]?.toUpperCase()}
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
