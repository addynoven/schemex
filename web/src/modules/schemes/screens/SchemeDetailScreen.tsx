'use client'

import { useState, useEffect } from 'react'
import { useParams, Link } from '@/router'
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  MapPin,
  FolderLock,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import {
  getSchemeBySlug,
  getSchemeDocumentReadiness,
  listSavedSchemes,
  saveScheme,
  deleteSavedScheme,
  type Scheme,
  type SchemeExplanation,
  type SchemeDocumentReadiness,
} from '@/lib/api'
import { getSavedEligibilityReport, getCitizenToken, getCitizenUser } from '@/lib/session'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  NbButton,
  NbCard,
  NbBadge,
} from '@/core/design-system/Neubrutalist'

export function SchemeDetailScreen({ slug: propSlug }: { slug?: string } = {}) {
  const params = useParams('/schemes/:slug' as any)
  const slug =
    propSlug ||
    (typeof params?.slug === 'string'
      ? params.slug
      : Array.isArray(params?.slug)
      ? params.slug[0]
      : '')
  const [scheme, setScheme] = useState<Scheme | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docReadiness, setDocReadiness] = useState<SchemeDocumentReadiness | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getSchemeBySlug(slug)
      .then((data) => {
        setScheme(data)
        setLoading(false)
        const token = getCitizenToken()
        if (token) {
          getSchemeDocumentReadiness(data.id)
            .then((readiness) => setDocReadiness(readiness))
            .catch(() => {})
        }
      })
      .catch((err) => {
        setError(err.message || 'Scheme not found')
        setLoading(false)
      })

    const user = getCitizenUser()
    if (user?.id) {
      listSavedSchemes(user.id)
        .then((items) => {
          setIsSaved(items.some((i) => i.scheme_slug === slug))
        })
        .catch(() => {})
    } else {
      try {
        const raw = localStorage.getItem('schemes_saved_slugs')
        if (raw) {
          const list: string[] = JSON.parse(raw)
          setIsSaved(list.includes(slug))
        }
      } catch {}
    }
  }, [slug])

  const handleToggleBookmark = async () => {
    if (!slug) return
    const user = getCitizenUser()
    const nextSaved = !isSaved
    setIsSaved(nextSaved)

    if (user?.id) {
      if (nextSaved) {
        saveScheme(user.id, slug).catch(() => {})
      } else {
        deleteSavedScheme(user.id, slug).catch(() => {})
      }
    } else {
      try {
        const raw = localStorage.getItem('schemes_saved_slugs')
        let list: string[] = raw ? JSON.parse(raw) : []
        if (nextSaved) {
          if (!list.includes(slug)) list.push(slug)
        } else {
          list = list.filter((s) => s !== slug)
        }
        localStorage.setItem('schemes_saved_slugs', JSON.stringify(list))
      } catch {}
    }
  }

  // Check if citizen has a saved eligibility verdict for this scheme
  const savedReport = getSavedEligibilityReport()
  let userExplanation: SchemeExplanation | undefined
  if (savedReport && slug) {
    userExplanation = [
      ...savedReport.eligible_schemes,
      ...savedReport.nearly_eligible_schemes,
      ...savedReport.ineligible_schemes,
    ].find((s) => s.scheme_slug === slug)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-pulse p-6">
          <div className="h-6 w-32 bg-slate-200 rounded-lg" />
          <div className="h-48 bg-white border border-slate-200 rounded-3xl" />
          <div className="h-64 bg-white border border-slate-200 rounded-3xl" />
        </div>
      </AppLayout>
    )
  }

  if (error || !scheme) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-16 px-4">
          <NbCard className="p-8 text-center flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-2" />
            <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Scheme Not Found</h2>
            <p className="text-sm text-black/70 dark:text-white/70">
              The requested government scheme does not exist or has been removed.
            </p>
            <Link to="/schemes" className="mt-2">
              <NbButton nbVariant="primary" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Return to All Schemes</span>
              </NbButton>
            </Link>
          </NbCard>
        </div>
      </AppLayout>
    )
  }

  const applyUrl = scheme.application_url || scheme.official_website

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8 p-4 sm:p-6 font-sans">
        {/* Back Navigation & Bookmark Action */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to={savedReport ? '/results' : '/schemes'}>
            <NbButton nbVariant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{savedReport ? 'Back to Results' : 'Back to All Schemes'}</span>
            </NbButton>
          </Link>

          <div className="flex items-center gap-2">
            <NbButton
              type="button"
              onClick={handleToggleBookmark}
              nbVariant={isSaved ? 'primary' : 'outline'}
              size="sm"
              className="gap-1.5"
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4 text-black" /> : <Bookmark className="h-4 w-4" />}
              <span>{isSaved ? 'Saved' : 'Save Scheme'}</span>
            </NbButton>

            {applyUrl && (
              <a href={applyUrl} target="_blank" rel="noreferrer">
                <NbButton nbVariant="primary" size="sm" className="gap-1.5">
                  <span>Apply on Official Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </NbButton>
              </a>
            )}
          </div>
        </div>

        {/* Header Banner Window */}
        <NbCard className="p-6 sm:p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            {scheme.state && scheme.state !== 'ALL_INDIA' ? (
              <NbBadge nbVariant="amber" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                State: {scheme.state}
              </NbBadge>
            ) : (
              <NbBadge nbVariant="outline">
                🇮🇳 National Scheme
              </NbBadge>
            )}

            <NbBadge nbVariant="emerald">
              {scheme.category}
            </NbBadge>

            <NbBadge nbVariant="outline" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {scheme.ministry}
            </NbBadge>

            {scheme.launch_date && (
              <NbBadge nbVariant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Launched: {scheme.launch_date}
              </NbBadge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight leading-tight">
            {scheme.name}
          </h1>

          <p className="text-sm sm:text-base text-black/80 dark:text-white/80 leading-relaxed max-w-3xl font-medium">
            {scheme.description}
          </p>
        </NbCard>

        {/* "Why You Match" Personalized Card (if user checked eligibility) */}
        {userExplanation && (
          <NbCard className="p-6 sm:p-7 flex flex-col gap-4 bg-emerald-50 dark:bg-emerald-950/30 border-black dark:border-emerald-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-black text-black dark:text-white uppercase tracking-wider">
                  Your Match Verdict
                </h2>
              </div>
              <NbBadge nbVariant={userExplanation.is_eligible ? 'emerald' : 'amber'}>
                {userExplanation.is_eligible
                  ? '100% Eligible'
                  : `${userExplanation.match_percentage}% Match`}
              </NbBadge>
            </div>

            <p className="text-xs sm:text-sm text-black dark:text-white bg-[#FFFDF9] dark:bg-[#131F18] p-4 rounded-xl border-2 border-black dark:border-emerald-500/40 leading-relaxed font-semibold">
              {userExplanation.summary_reason}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {userExplanation.passed_criteria.map((c) => (
                <div
                  key={c.field}
                  className="p-3.5 rounded-xl bg-[#FFFDF9] dark:bg-[#131F18] border-2 border-black dark:border-emerald-500/40 flex items-start gap-2.5 text-xs shadow-[2px_2px_0px_#000]"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-black dark:text-white">{c.criterion_title}</span>
                    <span className="text-black/70 dark:text-white/70 text-[11px] font-medium">{c.reason}</span>
                  </div>
                </div>
              ))}

              {userExplanation.failed_criteria.map((c) => (
                <div
                  key={c.field}
                  className="p-3.5 rounded-xl bg-[#FFFDF9] dark:bg-[#131F18] border-2 border-black dark:border-rose-500/50 flex items-start gap-2.5 text-xs shadow-[2px_2px_0px_#000]"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-black dark:text-white">{c.criterion_title}</span>
                    <span className="text-black/70 dark:text-white/70 text-[11px] font-medium">{c.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </NbCard>
        )}

        {/* Grid: Benefits & Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Benefits */}
          <NbCard className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-black dark:text-white font-black text-base uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Scheme Benefits</span>
            </div>

            {!scheme.benefits || scheme.benefits.length === 0 ? (
              <p className="text-xs text-black/60 dark:text-white/60">No benefits listed.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {scheme.benefits.map((benefit) => {
                  const benefitTitle = benefit.title || benefit.benefit_type || 'Direct Benefit'
                  return (
                    <div
                      key={benefit.id}
                      className="p-4 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500/40 flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-emerald-800 dark:text-emerald-400">
                          {benefitTitle}
                        </span>
                        {benefit.amount && (
                          <NbBadge nbVariant="emerald" className="font-mono text-[11px]">
                            ₹{benefit.amount.toLocaleString('en-IN')}
                          </NbBadge>
                        )}
                      </div>
                      {benefit.description && (
                        <p className="text-black/80 dark:text-white/80 text-xs mt-1 leading-relaxed font-medium">
                          {benefit.description}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </NbCard>

          {/* 2. Eligibility Criteria Rules */}
          <NbCard className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-black dark:text-white font-black text-base uppercase tracking-wider">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Eligibility Requirements</span>
            </div>

            {!scheme.eligibility_rules || scheme.eligibility_rules.length === 0 ? (
              <p className="text-xs text-black/60 dark:text-white/60">Universal scheme with no restrictive rules.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {scheme.eligibility_rules.map((rule) => {
                  const rawField = rule.field_name || rule.field || 'Condition'
                  const fieldLabel = rawField.replace(/_/g, ' ')
                  const operatorLabel =
                    rule.operator === 'eq'
                      ? '='
                      : rule.operator === 'lte'
                      ? '≤'
                      : rule.operator === 'gte'
                      ? '≥'
                      : rule.operator === 'between'
                      ? 'between'
                      : rule.operator
                  const ruleVal = rule.rule_value || rule.value || ''

                  return (
                    <div
                      key={rule.id}
                      className="p-3.5 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500/40 flex items-start gap-3 text-xs"
                    >
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-black mt-1 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-black dark:text-white capitalize">
                          {fieldLabel}: {operatorLabel} {ruleVal}
                        </span>
                        {rule.description && (
                          <p className="text-black/60 dark:text-white/60 text-[11px] font-medium">{rule.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </NbCard>
        </div>

        {/* UNIFIED DOCUMENT READINESS & APPLICATION TRACKER */}
        <NbCard className="p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-black dark:border-emerald-500/30">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FolderLock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-black text-black dark:text-white uppercase tracking-wider">
                  Required Application Documents
                </h2>
              </div>
              <p className="text-xs text-black/70 dark:text-white/70 font-medium">
                {docReadiness
                  ? docReadiness.summary
                  : `${scheme.required_documents?.length || 0} document(s) required to verify eligibility and apply.`}
              </p>
            </div>

            {docReadiness ? (
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-black/60 dark:text-white/60 uppercase tracking-wider font-bold">
                    Readiness Score
                  </span>
                  <NbBadge
                    nbVariant={
                      docReadiness.readiness_percentage === 100
                        ? 'emerald'
                        : docReadiness.readiness_percentage > 0
                        ? 'amber'
                        : 'rose'
                    }
                    className="text-sm font-mono px-3 py-1"
                  >
                    {docReadiness.readiness_percentage}% Ready
                  </NbBadge>
                </div>
              </div>
            ) : (
              <Link to="/vault">
                <NbButton nbVariant="outline" size="sm" className="gap-1.5">
                  <FolderLock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Verify with Vault</span>
                </NbButton>
              </Link>
            )}
          </div>

          {/* Static Document List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {scheme.required_documents?.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500/40 flex flex-col justify-between gap-2 text-xs"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-black dark:text-white">
                      {doc.document_name}
                    </span>
                    <NbBadge
                      nbVariant={doc.is_mandatory ? 'rose' : 'outline'}
                      className="text-[10px] py-0 px-2"
                    >
                      {doc.is_mandatory ? 'Mandatory' : 'Optional'}
                    </NbBadge>
                  </div>
                  {doc.description && (
                    <p className="text-black/60 dark:text-white/60 text-[11px] font-medium leading-relaxed">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </NbCard>

        {/* Official Links & Apply Action */}
        <NbCard className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wider">
                Ready to Submit Your Application?
              </h3>
            </div>
            <p className="text-xs text-black/70 dark:text-white/70 font-medium">
              Submit your application directly through the official Government portal.
            </p>
          </div>

          {applyUrl && (
            <a href={applyUrl} target="_blank" rel="noreferrer">
              <NbButton nbVariant="primary" className="gap-2">
                <span>Open Official Portal</span>
                <ExternalLink className="h-4 w-4" />
              </NbButton>
            </a>
          )}
        </NbCard>
      </div>
    </AppLayout>
  )
}
