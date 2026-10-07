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
        <div className="max-w-xl mx-auto text-center py-16 px-4 flex flex-col items-center gap-4 font-sans">
          <AlertCircle className="h-12 w-12 text-rose-500 mb-2" />
          <h2 className="text-xl font-bold text-slate-900">Scheme Not Found</h2>
          <p className="text-sm text-slate-600">
            The requested government scheme does not exist or has been removed.
          </p>
          <Link
            to="/schemes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white text-xs font-bold shadow-xs transition-colors mt-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to All Schemes</span>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const applyUrl = scheme.application_url || scheme.official_website

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8 p-4 sm:p-6 font-sans">
        {/* Back Navigation & Bookmark Action */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to={savedReport ? '/results' : '/schemes'}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#0E6245]" />
            <span>{savedReport ? 'Back to Results' : 'Back to All Schemes'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4 text-[#92400E]" /> : <Bookmark className="h-4 w-4" />}
              <span>{isSaved ? 'Saved' : 'Save Scheme'}</span>
            </button>

            {applyUrl && (
              <a
                href={applyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white text-xs font-bold shadow-xs transition-all"
              >
                <span>Apply on Official Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Header Banner */}
        <div className="p-6 sm:p-10 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col gap-4 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            {scheme.state && scheme.state !== 'ALL_INDIA' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                State: {scheme.state}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                🇮🇳 National Scheme
              </span>
            )}

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
              {scheme.category}
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {scheme.ministry}
            </span>

            {scheme.launch_date && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Launched: {scheme.launch_date}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {scheme.name}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl font-medium">
            {scheme.description}
          </p>
        </div>

        {/* "Why You Match" Personalized Card (if user checked eligibility) */}
        {userExplanation && (
          <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200 bg-[#F0FDF4] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#0E6245]" />
                <h2 className="text-lg font-bold text-slate-900">
                  Your Match Verdict
                </h2>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  userExplanation.is_eligible
                    ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                    : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                }`}
              >
                {userExplanation.is_eligible
                  ? '100% Eligible'
                  : `${userExplanation.match_percentage}% Match`}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 bg-white p-4 rounded-2xl border border-slate-200 leading-relaxed font-medium">
              {userExplanation.summary_reason}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {userExplanation.passed_criteria.map((c) => (
                <div
                  key={c.field}
                  className="p-3.5 rounded-xl bg-white border border-emerald-200 flex items-start gap-2.5 text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900">{c.criterion_title}</span>
                    <span className="text-slate-600 text-[11px] font-medium">{c.reason}</span>
                  </div>
                </div>
              ))}

              {userExplanation.failed_criteria.map((c) => (
                <div
                  key={c.field}
                  className="p-3.5 rounded-xl bg-white border border-rose-200 flex items-start gap-2.5 text-xs"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900">{c.criterion_title}</span>
                    <span className="text-slate-600 text-[11px] font-medium">{c.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid: Benefits & Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Benefits */}
          <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Sparkles className="h-4 w-4 text-[#0E6245]" />
              <span>Scheme Benefits</span>
            </div>

            {!scheme.benefits || scheme.benefits.length === 0 ? (
              <p className="text-xs text-slate-500">No benefits listed.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {scheme.benefits.map((benefit) => {
                  const benefitTitle = benefit.title || benefit.benefit_type || 'Direct Benefit'
                  return (
                    <div
                      key={benefit.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#166534]">
                          {benefitTitle}
                        </span>
                        {benefit.amount && (
                          <span className="font-extrabold text-slate-900 bg-[#DCFCE7] px-2.5 py-0.5 rounded-full text-[11px] border border-[#BBF7D0]">
                            ₹{benefit.amount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      {benefit.description && (
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed font-medium">
                          {benefit.description}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 2. Eligibility Criteria Rules */}
          <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Layers className="h-4 w-4 text-[#0E6245]" />
              <span>Eligibility Requirements</span>
            </div>

            {!scheme.eligibility_rules || scheme.eligibility_rules.length === 0 ? (
              <p className="text-xs text-slate-500">Universal scheme with no restrictive rules.</p>
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
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs"
                    >
                      <div className="h-2 w-2 rounded-full bg-[#0E6245] mt-1.5 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 capitalize">
                          {fieldLabel}: {operatorLabel} {ruleVal}
                        </span>
                        {rule.description && (
                          <p className="text-slate-500 text-[11px] font-medium">{rule.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* UNIFIED DOCUMENT READINESS & APPLICATION TRACKER */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FolderLock className="h-5 w-5 text-[#0E6245]" />
                <h2 className="text-lg font-bold text-slate-900">
                  Required Application Documents
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {docReadiness
                  ? docReadiness.summary
                  : `${scheme.required_documents?.length || 0} document(s) required to verify eligibility and apply.`}
              </p>
            </div>

            {docReadiness ? (
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Readiness Score
                  </span>
                  <span
                    className={`text-lg font-black font-mono px-3 py-1 rounded-full border ${
                      docReadiness.readiness_percentage === 100
                        ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
                        : docReadiness.readiness_percentage > 0
                        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {docReadiness.readiness_percentage}% Ready
                  </span>
                </div>
              </div>
            ) : (
              <Link
                to="/vault"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors"
              >
                <FolderLock className="h-4 w-4 text-[#0E6245]" />
                <span>Verify with Vault</span>
              </Link>
            )}
          </div>

          {/* Static Document List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {scheme.required_documents?.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2 text-xs"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {doc.document_name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        doc.is_mandatory
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {doc.is_mandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Links & Apply Action */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="h-5 w-5 text-[#0E6245]" />
              <h3 className="text-lg font-bold text-slate-900">
                Ready to Submit Your Application?
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Submit your application directly through the official Government portal.
            </p>
          </div>

          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0E6245] hover:bg-[#004831] text-white font-black text-sm shadow-xs transition-all"
            >
              <span>Open Official Portal</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
