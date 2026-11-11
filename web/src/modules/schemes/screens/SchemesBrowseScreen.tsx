'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Building2,
  ChevronDown,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Bookmark,
  X,
  CheckCircle2,
  Leaf,
  Compass,
  Activity,
  Award,
  Layers,
  FolderLock,
  FileCheck,
} from 'lucide-react'
import {
  getSchemeCategories,
  listSchemesPaginated,
  listSavedSchemes,
  saveScheme,
  deleteSavedScheme,
  getSchemeBySlug,
  getSchemeDocumentReadiness,
  type Scheme,
  type SchemeDocumentReadiness,
} from '@/lib/api'
import { getCitizenUser } from '@/lib/session'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  NbCard,
  NbButton,
  NbBadge,
  NbInput,
} from '@/core/design-system/Neubrutalist'

const ALL_INDIAN_STATES = [
  'All India',
  'Central Only',
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

const CATEGORY_CHIPS = [
  { id: 'All', label: 'All Categories', icon: <Layers className="h-4 w-4" /> },
  { id: 'Agriculture', label: 'Agriculture', icon: <Leaf className="h-4 w-4" /> },
  { id: 'Cash Grants', label: 'Cash Grants', icon: <Award className="h-4 w-4" /> },
  { id: 'Healthcare', label: 'Healthcare', icon: <Activity className="h-4 w-4" /> },
  { id: 'Education', label: 'Education', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'Housing', label: 'Housing', icon: <Building2 className="h-4 w-4" /> },
]

const SORT_OPTIONS = [
  { label: 'Sort: Relevance', value: '' },
  { label: 'Sort: Highest Benefit', value: 'benefit_desc' },
  { label: 'Sort: Earliest Deadline', value: 'deadline_asc' },
  { label: 'Sort: Recently Added', value: 'id_desc' },
]

export function SchemesBrowseScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams?.get('category') || 'All'
  const initialState = searchParams?.get('state') || 'All India'
  const initialSearch = searchParams?.get('q') || searchParams?.get('search') || ''

  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters State
  const [search, setSearch] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory)
  const [jurisdiction, setJurisdiction] = useState(initialState)
  const [sortBy, setSortBy] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Master-Detail State
  const [selectedSchemeSlug, setSelectedSchemeSlug] = useState<string | null>(null)
  const [detailedScheme, setDetailedScheme] = useState<Scheme | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<'overview' | 'eligibility' | 'documents' | 'faq'>('overview')
  const [readiness, setReadiness] = useState<SchemeDocumentReadiness | null>(null)

  // In-memory caches for instant 0ms switching without loading flicker
  const schemeCacheRef = useRef<Map<string, Scheme>>(new Map())
  const readinessCacheRef = useRef<Map<number, SchemeDocumentReadiness>>(new Map())

  // Prefetch scheme details on hover or focus for instant 0ms display
  const prefetchScheme = useCallback((slug: string) => {
    if (schemeCacheRef.current.has(slug)) return
    getSchemeBySlug(slug)
      .then((data) => {
        schemeCacheRef.current.set(slug, data)
      })
      .catch(() => {})
  }, [])

  // Saved Schemes & Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all')
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set())
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const currentUser = getCitizenUser()

  useEffect(() => {
    if (currentUser?.id) {
      listSavedSchemes(currentUser.id)
        .then((items) => {
          setSavedSlugs(new Set(items.map((i) => i.scheme_slug)))
        })
        .catch(() => {})
    } else {
      try {
        const raw = localStorage.getItem('schemes_saved_slugs')
        if (raw) setSavedSlugs(new Set(JSON.parse(raw)))
      } catch {}
    }
  }, [currentUser?.id])

  const toggleBookmark = async (e: React.MouseEvent, schemeSlug: string) => {
    e.preventDefault()
    e.stopPropagation()
    const next = new Set(savedSlugs)
    const isSaved = next.has(schemeSlug)

    if (isSaved) {
      next.delete(schemeSlug)
      setSavedSlugs(next)
      if (currentUser?.id) deleteSavedScheme(currentUser.id, schemeSlug).catch(() => {})
      else localStorage.setItem('schemes_saved_slugs', JSON.stringify(Array.from(next)))
    } else {
      next.add(schemeSlug)
      setSavedSlugs(next)
      if (currentUser?.id) saveScheme(currentUser.id, schemeSlug).catch(() => {})
      else localStorage.setItem('schemes_saved_slugs', JSON.stringify(Array.from(next)))

      setToastMessage('Saved to My Schemes')
      setTimeout(() => setToastMessage(null), 3800)
    }
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Sync with URL query parameter changes (e.g. from topbar search or direct links)
  const urlSearch = searchParams?.get('q') || searchParams?.get('search') || ''
  useEffect(() => {
    setSearch(urlSearch)
    setDebouncedSearch(urlSearch)
    setPage(1)
  }, [urlSearch])

  const fetchSchemes = useCallback(async () => {
    setLoading(true)
    try {
      const skip = (page - 1) * pageSize
      const effectiveState =
        jurisdiction === 'All India'
          ? undefined
          : jurisdiction === 'Central Only'
          ? 'ALL_INDIA'
          : jurisdiction

      const effectiveCategory = category !== 'All' && category !== 'Cash Grants' ? category : undefined

      const res = await listSchemesPaginated({
        skip,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        category: effectiveCategory,
        state: effectiveState,
        sort_by: sortBy || undefined,
      })
      setSchemes(res.items || [])
      setTotal(res.total || 0)

      // Auto-select first scheme if results exist
      if (res.items && res.items.length > 0) {
        setSelectedSchemeSlug((prev) => {
          const stillPresent = res.items.some((i) => i.slug === prev)
          return prev && stillPresent ? prev : res.items[0].slug
        })
      } else {
        setSelectedSchemeSlug(null)
        setDetailedScheme(null)
      }
    } catch {
      setSchemes([])
      setTotal(0)
      setSelectedSchemeSlug(null)
      setDetailedScheme(null)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, category, jurisdiction, sortBy])

  useEffect(() => {
    fetchSchemes()
  }, [fetchSchemes])

  // Fetch Detailed Data when a scheme is selected from left column (cache-first, non-flickering)
  useEffect(() => {
    if (!selectedSchemeSlug) return

    let cancelled = false

    // 1. Instant Cache Hit: 0ms transition without touching loading state
    if (schemeCacheRef.current.has(selectedSchemeSlug)) {
      const cached = schemeCacheRef.current.get(selectedSchemeSlug)!
      setDetailedScheme(cached)
      setIsDetailLoading(false)

      if (currentUser?.id && cached.id) {
        if (readinessCacheRef.current.has(cached.id)) {
          setReadiness(readinessCacheRef.current.get(cached.id)!)
        } else {
          getSchemeDocumentReadiness(cached.id)
            .then((readData) => {
              if (!cancelled) {
                readinessCacheRef.current.set(cached.id, readData)
                setReadiness(readData)
              }
            })
            .catch(() => {})
        }
      }
      return
    }

    // 2. Cache Miss: Keep previous scheme visible on screen (NO setDetailedScheme(null))!
    setIsDetailLoading(true)

    getSchemeBySlug(selectedSchemeSlug)
      .then((data) => {
        if (cancelled) return
        schemeCacheRef.current.set(selectedSchemeSlug, data)
        setDetailedScheme(data)
        setIsDetailLoading(false)

        if (currentUser?.id) {
          getSchemeDocumentReadiness(data.id)
            .then((readData) => {
              if (!cancelled) {
                readinessCacheRef.current.set(data.id, readData)
                setReadiness(readData)
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsDetailLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedSchemeSlug, currentUser?.id])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setCategory('All')
    setJurisdiction('All India')
    setSortBy('')
    setPage(1)
    router.push('/schemes')
  }

  const displayedSchemes = useMemo(() => {
    if (activeTab === 'saved') {
      return schemes.filter((s) => savedSlugs.has(s.slug))
    }
    return schemes
  }, [activeTab, schemes, savedSlugs])

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <AppLayout>
      <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 flex flex-col font-sans">

        {/* Toast Notification */}
        <div className={`fixed bottom-6 right-8 z-50 flex items-center gap-3 bg-emerald-400 text-black border-2 border-black px-5 py-4 rounded-xl shadow-[4px_4px_0px_0px_#000000] transition-all duration-300 transform ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
          <CheckCircle2 className="h-6 w-6 text-black" />
          <div className="flex flex-col">
            <span className="text-sm font-black">{toastMessage}</span>
            <span className="text-[11px] font-bold text-slate-900">Added to your quick vault for offline tracking</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-black hover:scale-110 transition-transform cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Hero / Guided Discovery Banner */}
        <section className="p-6 lg:p-8 bg-[#FFFDF9] dark:bg-[#131F18] border-b-2 border-black dark:border-emerald-500/80 flex flex-col gap-6 shrink-0 z-10 transition-colors">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-400 text-black border-2 border-black text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000000]">
                  :: National Direct Benefit Portal
                </span>
                <span className="text-black dark:text-emerald-500 font-bold">•</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-emerald-400 font-black">
                  4,162 Schemes Synchronized
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                Schemes — Browse & Discover Hub
              </h1>
              <p className="text-sm text-slate-700 dark:text-slate-300 max-w-2xl font-semibold leading-relaxed">
                Search, filter, evaluate statutory eligibility, and bookmark citizen welfare initiatives from 4,160+ central and state government ministries.
              </p>
            </div>

            {/* Quick Metrics Counter Group */}
            <div className="flex items-center gap-3 self-start xl:self-auto">
              <div className="flex flex-col px-4 py-2.5 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669]">
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Schemes</span>
                <span className="text-xl font-black text-black dark:text-white font-mono">4,162</span>
              </div>
              <div className="flex flex-col px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669]">
                <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Filtered Matches</span>
                <span className="text-xl font-black text-black dark:text-white font-mono">{total}</span>
              </div>
              <div className="flex flex-col px-4 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669]">
                <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">My Saved</span>
                <span className="text-xl font-black text-black dark:text-white font-mono">{savedSlugs.size}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Controls Toolbar */}
        <section className="px-6 lg:px-8 py-4 bg-[#FFFDF9] dark:bg-[#131F18] border-b-2 border-black dark:border-emerald-500/80 flex flex-col gap-4 shrink-0 z-10 transition-colors">
          <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">

            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 dark:text-emerald-400 pointer-events-none z-10" />
              <NbInput
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by scheme name, ministry, target demographic or benefit..."
                className="pl-11 h-12"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black dark:text-white hover:scale-110 flex items-center justify-center cursor-pointer z-10">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="relative min-w-[190px]">
                <select
                  value={jurisdiction}
                  onChange={(e) => { setJurisdiction(e.target.value); setPage(1); }}
                  className="w-full h-12 pl-4 pr-10 rounded-xl bg-[#FFFDF9] dark:bg-[#0B120E] text-sm font-bold text-black dark:text-white focus:outline-none appearance-none cursor-pointer border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] transition-all"
                >
                  {ALL_INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s === 'All India' ? '🇮🇳 All India (Central)' : s === 'Central Only' ? '🏛️ Central Govt Only' : `📍 ${s}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-emerald-400 pointer-events-none" />
              </div>

              <div className="relative min-w-[190px]">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full h-12 pl-4 pr-10 rounded-xl bg-[#FFFDF9] dark:bg-[#0B120E] text-sm font-bold text-black dark:text-white focus:outline-none appearance-none cursor-pointer border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] transition-all"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-emerald-400 pointer-events-none" />
              </div>

              <div className="flex items-center p-1 bg-[#F4EFEA] dark:bg-[#0B120E] rounded-xl border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669]">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-emerald-400 text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000000]'
                      : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span>All Schemes</span>
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'saved'
                      ? 'bg-emerald-400 text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000000]'
                      : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5 text-black" />
                  <span>Saved</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-black text-white font-mono text-[10px]">{savedSlugs.size}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Chips Scroll Row */}
          <div className="max-w-[1400px] mx-auto w-full flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {CATEGORY_CHIPS.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setPage(1); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-400 dark:bg-emerald-500 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-slate-300 border-2 border-black dark:border-emerald-500/80 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 shadow-[1px_1px_0px_0px_#000000]'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Master-Detail 2-Column Desktop Layout */}
        <div className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* LEFT COLUMN: Scheme Discovery & Browse List */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
                :: Schemes Catalog
                <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-black border-2 border-black font-black text-xs shadow-[1.5px_1.5px_0px_0px_#000000]">{total}</span>
              </h2>
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">Click card to preview details</span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#131F18] border-2 border-black dark:border-emerald-500/80 shadow-[3px_3px_0px_0px_#000000] animate-pulse h-40" />
                ))}
              </div>
            ) : displayedSchemes.length === 0 ? (
              <NbCard className="p-12 text-center flex flex-col items-center">
                <BookOpen className="h-10 w-10 text-black dark:text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-black text-black dark:text-white">No matching schemes found</h3>
                <NbButton onClick={handleResetFilters} nbVariant="primary" className="mt-4">
                  Reset All Filters
                </NbButton>
              </NbCard>
            ) : (
              <div className="flex flex-col gap-4">
                {displayedSchemes.map((scheme) => {
                  const isSelected = selectedSchemeSlug === scheme.slug
                  const isSaved = savedSlugs.has(scheme.slug)

                  return (
                    <NbCard
                      key={scheme.id}
                      onClick={() => setSelectedSchemeSlug(scheme.slug)}
                      onMouseEnter={() => prefetchScheme(scheme.slug)}
                      onFocus={() => prefetchScheme(scheme.slug)}
                      className={`group cursor-pointer p-4 sm:p-5 flex flex-col gap-3 relative min-w-0 overflow-hidden transition-all ${
                        isSelected
                          ? 'border-2 border-black dark:border-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#10B981]'
                          : 'hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000] dark:hover:shadow-[4px_4px_0px_0px_#10B981]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#000000] ${isSelected ? 'bg-emerald-400 text-black' : 'bg-[#F4EFEA] text-black'}`}>
                            <Leaf className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <NbBadge nbVariant="outline" className="text-[10px]">
                                {scheme.state === 'ALL_INDIA' ? 'National' : scheme.state}
                              </NbBadge>
                              <NbBadge nbVariant="emerald" className="text-[10px]">
                                {scheme.category || 'General'}
                              </NbBadge>
                            </div>
                            <h3 className="text-base font-black truncate text-black dark:text-white transition-colors">
                              {scheme.name}
                            </h3>
                            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold truncate mt-0.5 block max-w-full">
                              {scheme.ministry || 'Government of India'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => toggleBookmark(e, scheme.slug)}
                          className={`p-2 rounded-xl border-2 border-black transition-all shrink-0 z-10 shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                            isSaved ? 'text-black bg-amber-400' : 'text-black dark:text-white bg-[#F4EFEA] dark:bg-[#0B120E]'
                          }`}
                          title={isSaved ? "Saved" : "Save Scheme"}
                        >
                          <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </div>

                      <div className="p-3 rounded-xl border border-black dark:border-emerald-500/60 bg-[#F4EFEA] dark:bg-[#0B120E] flex items-center justify-between">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-0.5">Primary Benefit</span>
                          <span className="text-sm font-black text-black dark:text-white font-mono truncate">
                            Assistance
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end shrink-0">
                          <span className="text-[10px] font-black text-black bg-emerald-400 px-2.5 py-0.5 rounded-md border border-black">
                            Verify Match
                          </span>
                        </div>
                      </div>
                    </NbCard>
                  )
                })}
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-black dark:border-emerald-500/80">
                <NbButton
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page <= 1 || loading}
                  nbVariant="outline"
                  size="sm"
                >
                  Previous
                </NbButton>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-black dark:text-white bg-emerald-400 border-2 border-black px-3 py-1 rounded-lg shadow-[1.5px_1.5px_0px_0px_#000000]">{page}</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">of {totalPages}</span>
                </div>
                <NbButton
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages || loading}
                  nbVariant="outline"
                  size="sm"
                >
                  Next
                </NbButton>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Scheme Detailed Inspector */}
          <div className="lg:col-span-7 flex flex-col gap-6 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-none pb-8">
            {!detailedScheme ? (
              <NbCard className="p-12 flex flex-col items-center justify-center text-center min-h-[450px]">
                <Compass className="h-16 w-16 text-black dark:text-emerald-400 mb-4" />
                <h3 className="text-xl font-black text-black dark:text-white mb-2">Select a scheme to view details</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold max-w-sm">
                  Click on any scheme card from the catalog on the left to inspect its eligibility rules, benefits, and required documents.
                </p>
              </NbCard>
            ) : (
              <NbCard className={`p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden transition-opacity duration-200 ${isDetailLoading ? 'opacity-85' : 'opacity-100'}`}>
                {/* Non-intrusive hairline progress indicator */}
                {isDetailLoading && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 overflow-hidden z-30">
                    <div className="h-full bg-emerald-500 animate-pulse w-full" />
                  </div>
                )}

                {/* Header Ribbon */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-black dark:border-emerald-500/80">
                  <div className="flex items-center gap-2">
                    <NbBadge nbVariant="emerald">
                      {detailedScheme.state === 'ALL_INDIA' ? 'Central Government' : detailedScheme.state}
                    </NbBadge>
                    <NbBadge nbVariant="outline">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1" />
                      Verified Official
                    </NbBadge>
                    {isDetailLoading && (
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 animate-pulse">
                        Updating...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <NbButton
                      onClick={(e) => toggleBookmark(e, detailedScheme.slug)}
                      nbVariant={savedSlugs.has(detailedScheme.slug) ? 'secondary' : 'outline'}
                      size="sm"
                      className="gap-1.5"
                    >
                      <Bookmark className="h-4 w-4 shrink-0" fill={savedSlugs.has(detailedScheme.slug) ? "currentColor" : "none"} />
                      <span>{savedSlugs.has(detailedScheme.slug) ? 'Saved' : 'Save Scheme'}</span>
                    </NbButton>
                  </div>
                </div>

                {/* Scheme Hero Graphic Card */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-[#004831] border-2 border-black flex flex-col justify-end p-6 min-h-[160px] shadow-[3px_3px_0px_0px_#000000]">
                  <div className="relative z-10 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 font-mono">
                      DIRECT BENEFIT TRANSFER • DBT VERIFIED
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      {detailedScheme.name}
                    </h2>
                    <p className="text-xs text-emerald-100 font-bold max-w-xl">
                      {detailedScheme.ministry || 'Government of India'}
                    </p>
                  </div>
                </div>

                {/* Key Benefit Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500/80 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Primary Benefit</span>
                    <div>
                      <span className="text-lg font-black text-black dark:text-white font-mono">Assistance</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500/80 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Eligibility Status</span>
                    <div>
                      <Link href={`/check?target_scheme=${detailedScheme.slug}`} className="text-base font-black text-black dark:text-emerald-400 hover:underline flex items-center gap-1.5">
                        Check My Match <ArrowRight className="h-4 w-4 shrink-0" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Segmented Tab Navigation */}
                <div className="flex items-center gap-1.5 p-1.5 bg-[#F4EFEA] dark:bg-[#0B120E] rounded-2xl border-2 border-black dark:border-emerald-500 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669]">
                  <NbButton
                    onClick={() => setDetailTab('overview')}
                    nbVariant={detailTab === 'overview' ? 'activeTab' : 'ghost'}
                    size="sm"
                    className="flex-1"
                  >
                    Overview
                  </NbButton>
                  <NbButton
                    onClick={() => setDetailTab('eligibility')}
                    nbVariant={detailTab === 'eligibility' ? 'activeTab' : 'ghost'}
                    size="sm"
                    className="flex-1"
                  >
                    Eligibility
                  </NbButton>
                  <NbButton
                    onClick={() => setDetailTab('documents')}
                    nbVariant={detailTab === 'documents' ? 'activeTab' : 'ghost'}
                    size="sm"
                    className="flex-1 gap-1.5"
                  >
                    <span>Required Docs</span>
                    {readiness && <span className="bg-black text-white px-1.5 py-0.2 rounded-md font-mono text-[10px]">{readiness.readiness_percentage}%</span>}
                  </NbButton>
                </div>

                {/* Tab Content Panels */}
                <div className="min-h-[200px]">

                  {/* Overview Panel */}
                  {detailTab === 'overview' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-black dark:text-white">:: About the Scheme</h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap">
                          {detailedScheme.description || 'No detailed description available.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Eligibility Panel */}
                  {detailTab === 'eligibility' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                      <h3 className="text-base font-black text-black dark:text-white">:: Eligibility Matrix & Restrictions</h3>
                      <div className="flex flex-col gap-3">
                        {!detailedScheme.eligibility_rules || detailedScheme.eligibility_rules.length === 0 ? (
                          <div className="p-4 rounded-xl border-2 border-black dark:border-emerald-500 bg-[#F4EFEA] dark:bg-[#0B120E] text-sm text-black dark:text-white font-bold">
                            Universal scheme with no restrictive rules.
                          </div>
                        ) : (
                          detailedScheme.eligibility_rules.map((rule) => (
                            <div key={rule.id} className="flex items-start gap-3 p-4 rounded-xl border-2 border-black dark:border-emerald-500/80 bg-[#FFFDF9] dark:bg-[#0B120E] shadow-[2px_2px_0px_0px_#000000]">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-black text-black dark:text-white capitalize">
                                  {rule.field_name || rule.field}: {rule.operator === 'eq' ? '=' : rule.operator} {rule.rule_value || rule.value}
                                </span>
                                {rule.description && <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{rule.description}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documents Panel */}
                  {detailTab === 'documents' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                      <h3 className="text-base font-black text-black dark:text-white">:: Statutory Document Readiness</h3>
                      <div className="flex flex-col gap-3">
                        {!detailedScheme.required_documents || detailedScheme.required_documents.length === 0 ? (
                          <div className="p-4 rounded-xl border-2 border-black dark:border-emerald-500 bg-[#F4EFEA] dark:bg-[#0B120E] text-sm text-black dark:text-white font-bold">
                            No documents explicitly listed.
                          </div>
                        ) : (
                          detailedScheme.required_documents.map((doc) => {
                            const isAvailable = readiness?.checklist.find(c => c.document_name === doc.document_name)?.status === 'available'
                            return (
                              <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-black dark:border-emerald-500/80 bg-[#FFFDF9] dark:bg-[#0B120E] shadow-[2px_2px_0px_0px_#000000] gap-4">
                                <div className="flex items-center gap-3">
                                  <FolderLock className={`h-5 w-5 ${isAvailable ? 'text-black dark:text-emerald-400' : 'text-slate-400'}`} />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-black text-black dark:text-white">{doc.document_name}</span>
                                    {doc.description && <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{doc.description}</span>}
                                  </div>
                                </div>
                                {isAvailable ? (
                                  <NbBadge nbVariant="emerald">Ready in Vault</NbBadge>
                                ) : (
                                  <NbBadge nbVariant="rose">Action Needed</NbBadge>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer Action Terminal */}
                <div className="mt-4 pt-6 border-t-2 border-black dark:border-emerald-500/80 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] font-black text-slate-700 dark:text-emerald-400 font-mono">
                    :: ID: {detailedScheme.slug.toUpperCase()}
                  </span>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/tracking?scheme=${detailedScheme.slug}`}
                      className="px-4 py-2.5 rounded-xl border-2 border-black bg-emerald-100 hover:bg-emerald-200 text-black text-xs font-black shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck className="h-4 w-4 shrink-0" />
                      <span>Track Record</span>
                    </Link>

                    {detailedScheme.application_url && (
                      <a
                        href={detailedScheme.application_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 rounded-xl border-2 border-black bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2"
                      >
                        <span>Apply on Official Portal</span> <ExternalLink className="h-4 w-4 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>

              </NbCard>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
