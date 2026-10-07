'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  ArrowLeft,
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
  const [detailTab, setDetailTab] = useState<'overview' | 'eligibility' | 'documents' | 'faq'>('overview')
  const [readiness, setReadiness] = useState<SchemeDocumentReadiness | null>(null)

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

  // Fetch Detailed Data when a scheme is selected from left column
  useEffect(() => {
    if (selectedSchemeSlug) {
      setDetailedScheme(null)
      setReadiness(null)

      getSchemeBySlug(selectedSchemeSlug)
        .then((data) => {
          setDetailedScheme(data)
          if (currentUser?.id) {
            getSchemeDocumentReadiness(data.id)
              .then((readData) => setReadiness(readData))
              .catch(() => {})
          }
        })
        .catch(() => {})
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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">

        {/* Toast Notification (Step 5 Simulation) */}
        <div className={`fixed bottom-6 right-8 z-50 flex items-center gap-3 bg-[#0E6245] text-white px-5 py-4 rounded-xl shadow-xl transition-all duration-300 transform ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
          <CheckCircle2 className="h-6 w-6 text-[#A4F1B2]" />
          <div className="flex flex-col">
            <span className="text-sm font-bold">{toastMessage}</span>
            <span className="text-[11px] text-emerald-100 font-medium">Added to your quick vault for offline tracking</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-emerald-200 hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Hero / Guided Discovery Banner */}
        <section className="p-6 lg:p-8 bg-white shadow-sm flex flex-col gap-6 shrink-0 z-10 border-b border-slate-200">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#E2E7FF] text-[#131B2E] text-[11px] font-bold uppercase tracking-wider">National Direct Benefit Portal</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-[11px] text-slate-500 font-bold">Live DBT Synchronized</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Schemes — Browse & Discover Hub
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
                Search, filter, evaluate statutory eligibility, and bookmark citizen welfare initiatives from 4,160+ central and state government ministries.
              </p>
            </div>

            {/* Quick Metrics Counter Group */}
            <div className="flex items-center gap-3 self-start xl:self-auto">
              <div className="flex flex-col px-4 py-2.5 rounded-xl bg-[#F2F3FF] border border-[#E2E7FF]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Schemes</span>
                <span className="text-xl font-black text-[#0E6245] font-mono">4,162</span>
              </div>
              <div className="flex flex-col px-4 py-2.5 rounded-xl bg-[#F2F3FF] border border-[#E2E7FF]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filtered Matches</span>
                <span className="text-xl font-black text-[#1F6C3A] font-mono">{total}</span>
              </div>
              <div className="flex flex-col px-4 py-2.5 rounded-xl bg-[#F2F3FF] border border-[#E2E7FF]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">My Saved</span>
                <span className="text-xl font-black text-[#8F3E0C] font-mono">{savedSlugs.size}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Controls Toolbar */}
        <section className="px-6 lg:px-8 py-4 bg-white shadow-sm border-b border-slate-200 flex flex-col gap-4 shrink-0 z-10">
          <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">

            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by scheme name, ministry, target demographic or benefit..."
                className="w-full h-12 pl-12 pr-10 rounded-xl bg-[#F8FAFC] text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0E6245] border border-slate-200 transition-all font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="relative min-w-[190px]">
                <select
                  value={jurisdiction}
                  onChange={(e) => { setJurisdiction(e.target.value); setPage(1); }}
                  className="w-full h-12 pl-4 pr-10 rounded-xl bg-[#F8FAFC] text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E6245] appearance-none cursor-pointer border border-slate-200 transition-all"
                >
                  {ALL_INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s === 'All India' ? '🇮🇳 All India (Central)' : s === 'Central Only' ? '🏛️ Central Govt Only' : `📍 ${s}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative min-w-[190px]">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full h-12 pl-4 pr-10 rounded-xl bg-[#F8FAFC] text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E6245] appearance-none cursor-pointer border border-slate-200 transition-all"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="flex items-center p-1 bg-[#F8FAFC] rounded-xl border border-slate-200">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'all' ? 'bg-white text-[#0E6245] shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>All Schemes</span>
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'saved' ? 'bg-white text-[#0E6245] shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className="h-4 w-4 text-amber-600" />
                  <span>Saved</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#E2E7FF] text-[#0E6245] font-mono text-[10px]">{savedSlugs.size}</span>
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
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E6245] text-white shadow-sm'
                      : 'bg-[#F8FAFC] text-slate-700 hover:bg-[#F2F3FF] border border-slate-200'
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
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Schemes Catalog
                <span className="px-2 py-0.5 rounded-full bg-[#0E6245] text-white text-[11px] font-bold">{total}</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-bold">Click card to preview details</span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 animate-pulse h-40" />
                ))}
              </div>
            ) : displayedSchemes.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-slate-200">
                <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No matching schemes found</h3>
                <button onClick={handleResetFilters} className="mt-4 px-4 py-2 bg-[#0E6245] text-white rounded-xl text-xs font-bold cursor-pointer">
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {displayedSchemes.map((scheme) => {
                  const isSelected = selectedSchemeSlug === scheme.slug
                  const isSaved = savedSlugs.has(scheme.slug)

                  return (
                    <article
                      key={scheme.id}
                      onClick={() => setSelectedSchemeSlug(scheme.slug)}
                      className={`group cursor-pointer p-4 sm:p-5 rounded-2xl shadow-sm transition-all flex flex-col gap-3 relative min-w-0 overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-r from-white to-[#F2F3FF] border-2 border-[#0E6245] shadow-md'
                          : 'bg-white border border-slate-200 hover:border-[#0E6245]/40 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#A4F1B2] text-[#1F6C3A]' : 'bg-[#F2F3FF] text-[#0E6245]'}`}>
                            <Leaf className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                {scheme.state === 'ALL_INDIA' ? 'National Scheme' : scheme.state}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2F3FF] text-[#0E6245] border border-[#E2E7FF] shrink-0">
                                {scheme.category || 'General'}
                              </span>
                            </div>
                            <h3 className={`text-base font-black truncate transition-colors ${isSelected ? 'text-[#0E6245]' : 'text-slate-900 group-hover:text-[#0E6245]'}`}>
                              {scheme.name}
                            </h3>
                            <span className="text-[11px] text-slate-500 font-bold truncate mt-0.5 block max-w-full">
                              {scheme.ministry || 'Government of India'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => toggleBookmark(e, scheme.slug)}
                          className={`p-2 rounded-xl transition-colors shrink-0 z-10 ${isSaved ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                          title={isSaved ? "Saved" : "Save Scheme"}
                        >
                          <Bookmark className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </div>

                      <div className={`p-3 rounded-xl flex items-center justify-between ${isSelected ? 'bg-white/60' : 'bg-slate-50'}`}>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Primary Benefit</span>
                          <span className="text-sm font-black text-[#0E6245] font-mono truncate">
                            Assistance
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end shrink-0">
                          <span className="text-[10px] font-bold text-[#1F6C3A] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0]">
                            Verify Match
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page <= 1 || loading}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-50 cursor-pointer hover:bg-slate-50"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">{page}</span>
                  <span className="text-xs text-slate-500 font-bold">of {totalPages}</span>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages || loading}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-50 cursor-pointer hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Scheme Detailed Inspector */}
          <div className="lg:col-span-7 flex flex-col gap-6 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-none pb-8">
            {!detailedScheme ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[500px]">
                <Compass className="h-16 w-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">Select a scheme to view details</h3>
                <p className="text-sm text-slate-500 font-medium max-w-sm">
                  Click on any scheme card from the catalog on the left to inspect its eligibility rules, benefits, and required documents.
                </p>
              </div>
            ) : (
              <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col gap-6 relative overflow-hidden animate-in fade-in duration-300">

                {/* Header Ribbon */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-md bg-[#0E6245] text-white text-[10px] font-bold uppercase tracking-wider">
                      {detailedScheme.state === 'ALL_INDIA' ? 'Central Government' : detailedScheme.state}
                    </span>
                    <span className="px-3 py-1 rounded-md bg-[#DCFCE7] text-[#166534] text-[10px] font-bold flex items-center gap-1 border border-[#BBF7D0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Verified Official
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleBookmark(e, detailedScheme.slug)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        savedSlugs.has(detailedScheme.slug)
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                          : 'bg-slate-50 hover:bg-slate-100 text-[#0E6245] border-slate-200'
                      }`}
                    >
                      <Bookmark className="h-4 w-4 shrink-0" fill={savedSlugs.has(detailedScheme.slug) ? "currentColor" : "none"} />
                      <span className="hidden sm:inline">{savedSlugs.has(detailedScheme.slug) ? 'Saved in Vault' : 'Save Scheme'}</span>
                    </button>
                  </div>
                </div>

                {/* Scheme Hero Graphic Card */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-[#004831] flex flex-col justify-end p-6 min-h-[180px] border border-[#0E6245]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#004831] via-[#0E6245] to-[#1F6C3A] opacity-90" />
                  <div className="relative z-10 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A4F1B2] font-mono">
                      DIRECT BENEFIT TRANSFER • DBT-ID
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      {detailedScheme.name}
                    </h2>
                    <p className="text-xs text-[#DCFCE7] font-medium max-w-xl">
                      {detailedScheme.ministry || 'Government of India'}
                    </p>
                  </div>
                </div>

                {/* Key Benefit Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Primary Benefit</span>
                    <div>
                      <span className="text-lg font-black text-[#0E6245] font-mono">Assistance</span>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Eligibility Status</span>
                    <div>
                      <Link href={`/check?target_scheme=${detailedScheme.slug}`} className="text-lg font-black text-[#1F6C3A] hover:underline flex items-center gap-1.5">
                        Check My Match <ArrowRight className="h-4 w-4 shrink-0" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Segmented Tab Navigation (Cleaned borders & track lines) */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                  <button onClick={() => setDetailTab('overview')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${detailTab === 'overview' ? 'bg-white text-[#0E6245] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Overview</button>
                  <button onClick={() => setDetailTab('eligibility')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${detailTab === 'eligibility' ? 'bg-white text-[#0E6245] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Eligibility Criteria</button>
                  <button onClick={() => setDetailTab('documents')} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1.5 ${detailTab === 'documents' ? 'bg-white text-[#0E6245] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                    Required Docs {readiness && <span className="bg-[#DCFCE7] text-[#166534] px-1.5 rounded-sm">{readiness.readiness_percentage}%</span>}
                  </button>
                </div>

                {/* Tab Content Panels */}
                <div className="min-h-[220px]">

                  {/* Overview Panel */}
                  {detailTab === 'overview' && (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-slate-900">About the Scheme</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                          {detailedScheme.description || 'No detailed description available.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Eligibility Panel */}
                  {detailTab === 'eligibility' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                      <h3 className="text-base font-black text-slate-900 mb-2">Eligibility Matrix & Restrictions</h3>
                      <div className="flex flex-col gap-3">
                        {!detailedScheme.eligibility_rules || detailedScheme.eligibility_rules.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 font-medium">Universal scheme with no restrictive rules.</div>
                        ) : (
                          detailedScheme.eligibility_rules.map((rule) => (
                            <div key={rule.id} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                              <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5" />
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-slate-900 capitalize">
                                  {rule.field_name || rule.field}: {rule.operator === 'eq' ? '=' : rule.operator} {rule.rule_value || rule.value}
                                </span>
                                {rule.description && <span className="text-xs text-slate-500 font-medium">{rule.description}</span>}
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
                      <h3 className="text-base font-black text-slate-900 mb-2">Statutory Document Readiness</h3>
                      <div className="flex flex-col gap-3">
                        {!detailedScheme.required_documents || detailedScheme.required_documents.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 font-medium">No documents explicitly listed.</div>
                        ) : (
                          detailedScheme.required_documents.map((doc) => {
                            const isAvailable = readiness?.checklist.find(c => c.document_name === doc.document_name)?.status === 'available'
                            return (
                              <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-4">
                                <div className="flex items-center gap-3">
                                  <FolderLock className={`h-5 w-5 ${isAvailable ? 'text-[#0E6245]' : 'text-slate-400'}`} />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900">{doc.document_name}</span>
                                    {doc.description && <span className="text-xs text-slate-500 font-medium">{doc.description}</span>}
                                  </div>
                                </div>
                                {isAvailable ? (
                                  <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#166534] text-[10px] font-bold whitespace-nowrap border border-[#BBF7D0]">Ready in Vault</span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold whitespace-nowrap border border-slate-300">Action Needed</span>
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
                <div className="mt-4 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    ID: {detailedScheme.slug.toUpperCase()}
                  </span>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/tracking?scheme=${detailedScheme.slug}`}
                      className="px-4 py-3 rounded-xl bg-[#DCFCE7] hover:bg-[#bbf7d0] text-[#166534] text-xs font-bold border border-[#BBF7D0] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck className="h-4 w-4 shrink-0" />
                      <span>Track Application Record</span>
                    </Link>

                    {detailedScheme.application_url && (
                      <a
                        href={detailedScheme.application_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-3 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2"
                      >
                        <span>Apply on Official Portal</span> <ExternalLink className="h-4 w-4 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>

              </section>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
