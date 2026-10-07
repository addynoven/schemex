'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/router'
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  RotateCcw,
  BadgeCheck,
  TrendingUp,
  Landmark,
  FileCheck,
  User,
  ShieldAlert,
} from 'lucide-react'
import type { EligibilityReport, SchemeExplanation } from '@/lib/api'
import { getSavedEligibilityReport, getSavedCitizenProfile } from '@/lib/session'
import { AppLayout } from '@/components/layout/AppLayout'

export function ResultsScreen() {
  const [report, setReport] = useState<EligibilityReport | null>(null)
  const [activeTab, setActiveTab] = useState<'eligible' | 'nearly_eligible' | 'all'>('eligible')

  useEffect(() => {
    const data = getSavedEligibilityReport()
    if (data) {
      setReport(data)
    }
  }, [])

  const profile = getSavedCitizenProfile()

  if (!report) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto text-center py-16 px-4 flex flex-col items-center gap-4 font-sans">
          <AlertCircle className="h-12 w-12 text-slate-400 mb-2" />
          <h2 className="text-xl font-bold text-slate-900">No Evaluation Found</h2>
          <p className="text-sm text-slate-600 font-medium">
            Please fill out the eligibility form first to see your personalized scheme matches.
          </p>
          <Link
            to="/check"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white text-xs font-bold shadow-xs transition-colors mt-2"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Start Eligibility Check</span>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const displayedSchemes: SchemeExplanation[] =
    activeTab === 'eligible'
      ? report.eligible_schemes
      : activeTab === 'nearly_eligible'
      ? report.nearly_eligible_schemes
      : [...report.eligible_schemes, ...report.nearly_eligible_schemes, ...report.ineligible_schemes]

  return (
    <AppLayout>
      <div className="flex flex-col w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">

        {/* 1. Pipeline Audit & Breadcrumb Tracker */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#166534] font-bold text-xs border border-[#BBF7D0]">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                  Verified Citizen Match
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                  {profile?.district || 'Hassan'}, {profile?.state || 'Karnataka'}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-bold font-mono text-xs border border-slate-200">
                  ID: KA-HSN-99824
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                You qualify for <span className="text-[#0E6245]">{report.eligible_count} schemes</span>
              </h1>
              <p className="text-base text-slate-600 max-w-3xl font-medium leading-relaxed">
                We compared your verified profile with official state & central welfare rules. All required criteria are matched with zero pending paperwork.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DCFCE7]/60 text-[#0E6245] text-xs font-bold border border-[#BBF7D0]/60">
                  <CheckCircle2 className="h-4 w-4" /> Ready to Claim Immediately
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                  <Sparkles className="h-4 w-4 text-[#0E6245]" /> Zero Complex Paperwork
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                  <Landmark className="h-4 w-4 text-[#0E6245]" /> Direct to Bank DBT
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 w-full lg:w-auto">
              <Link to="/check" className="h-12 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm inline-flex items-center justify-center gap-2 border border-slate-200 transition-all active:scale-95 cursor-pointer">
                <RotateCcw className="h-4 w-4 text-slate-500" /> Edit Profile Facts
              </Link>
            </div>
          </div>
          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span>Eligibility audit complete ({report.total_evaluated} schemes processed)</span>
            </div>
            <span className="font-mono text-[#0E6245] font-black">Status: Ready for Instant Disbursement</span>
          </div>
        </section>

        {/* 2. High-Impact Welfare Scoreboard */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            onClick={() => setActiveTab('eligible')}
            className={`bg-white rounded-3xl p-6 shadow-sm border-2 transition-all flex flex-col justify-between cursor-pointer group ${activeTab === 'eligible' ? 'border-[#0E6245] shadow-md' : 'border-slate-200 hover:border-[#0E6245]/50'}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${activeTab === 'eligible' ? 'text-[#0E6245]' : 'text-slate-500'}`}>Ready to Claim Now</span>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${activeTab === 'eligible' ? 'bg-[#0E6245] text-white shadow-xs' : 'bg-slate-100 text-[#0E6245]'}`}>
                <BadgeCheck className="h-6 w-6" />
              </div>
            </div>
            <div className="my-4">
              <div className="text-4xl font-black text-slate-900">{report.eligible_count} <span className="text-2xl text-[#0E6245]">Schemes</span></div>
              <p className="text-sm text-slate-600 mt-2 font-medium">100% eligibility confirmed. Zero missing papers.</p>
            </div>
            <div className="text-xs font-bold text-[#0E6245] pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Pre-filled & ready</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('nearly_eligible')}
            className={`bg-white rounded-3xl p-6 shadow-sm border-2 transition-all flex flex-col justify-between cursor-pointer group ${activeTab === 'nearly_eligible' ? 'border-[#D97706] shadow-md' : 'border-slate-200 hover:border-[#F59E0B]/50'}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${activeTab === 'nearly_eligible' ? 'text-[#D97706]' : 'text-slate-500'}`}>Unlock With 1 Doc</span>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${activeTab === 'nearly_eligible' ? 'bg-[#F59E0B] text-white shadow-xs' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
                <FileCheck className="h-6 w-6" />
              </div>
            </div>
            <div className="my-4">
              <div className="text-4xl font-black text-[#D97706]">{report.nearly_eligible_count} <span className="text-2xl text-slate-900">Schemes</span></div>
              <p className="text-sm text-slate-600 mt-2 font-medium">Potential unlockable with missing vault document.</p>
            </div>
            <div className="text-xs font-bold text-[#D97706] pt-4 border-t border-slate-100 flex items-center justify-between">
              <span>Instant 1-Click Vault Sync</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('all')}
            className={`bg-white rounded-3xl p-6 shadow-sm border-2 transition-all flex flex-col justify-between cursor-pointer group ${activeTab === 'all' ? 'border-slate-800 shadow-md' : 'border-slate-200 hover:border-slate-400'}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${activeTab === 'all' ? 'text-slate-800' : 'text-slate-500'}`}>All Evaluated Schemes</span>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>
                <ShieldAlert className="h-6 w-6" />
              </div>
            </div>
            <div className="my-4">
              <div className="text-4xl font-black text-slate-900">{report.total_evaluated}</div>
              <p className="text-sm text-slate-600 mt-2 font-medium">Full diagnostic breakdown of all evaluated criteria.</p>
            </div>
            <div className="text-xs font-bold text-slate-700 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span>View full audit logs</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </section>

        {/* 3. Main Master Split Workspace */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Matched Scheme Cards (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {activeTab === 'eligible' && <CheckCircle2 className="h-6 w-6 text-[#16A34A]" />}
                  {activeTab === 'nearly_eligible' && <AlertCircle className="h-6 w-6 text-[#D97706]" />}
                  {activeTab === 'all' && <ShieldAlert className="h-6 w-6 text-slate-600" />}
                  <h2 className="text-xl font-black text-slate-900">
                    {activeTab === 'eligible' ? 'Ready to Claim Immediately' : activeTab === 'nearly_eligible' ? 'Nearly Eligible Schemes' : 'All Evaluated Schemes'} ({displayedSchemes.length})
                  </h2>
                </div>
                {activeTab === 'eligible' && (
                  <span className="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#166534] text-[11px] font-bold border border-[#BBF7D0]">
                    Zero Pending Blockers
                  </span>
                )}
              </div>

              {displayedSchemes.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <p className="text-slate-600 text-sm font-bold">No schemes in this category.</p>
                </div>
              ) : (
                displayedSchemes.map((scheme) => {
                  const is100 = scheme.is_eligible;
                  const isNearly = scheme.status === 'nearly_eligible';

                  return (
                    <article key={scheme.scheme_id} className={`bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all border-2 ${is100 ? 'border-[#0E6245]/20 hover:border-[#0E6245]' : isNearly ? 'border-[#D97706]/30 hover:border-[#D97706]' : 'border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${is100 ? 'bg-[#DCFCE7] text-[#166534]' : isNearly ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-slate-100 text-slate-500'}`}>
                            <Landmark className="h-7 w-7" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {is100 ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] text-[10px] font-bold uppercase tracking-wider border border-[#BBF7D0]">
                                  100% Eligible
                                </span>
                              ) : isNearly ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold uppercase tracking-wider border border-[#FDE68A]">
                                  {scheme.match_percentage}% Match
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider border border-rose-200">
                                  Ineligible
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                {scheme.state === 'ALL_INDIA' ? 'National Scheme' : scheme.state}
                              </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">{scheme.scheme_name}</h3>
                            <p className="text-xs text-slate-500 font-bold mt-1">{scheme.ministry}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4 mb-5">
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                          {scheme.summary_reason}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {scheme.passed_criteria.map((c) => (
                          <span key={c.field} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DCFCE7]/60 border border-[#BBF7D0] text-[#166534] text-[11px] font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {c.reason}
                          </span>
                        ))}
                        {scheme.failed_criteria.map((c) => (
                          <span key={c.field} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {c.reason}
                          </span>
                        ))}
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-[#0E6245] font-bold">
                          {is100 ? (
                            <><Sparkles className="h-4 w-4 text-amber-500" /> Form Pre-filled • Ready to Apply</>
                          ) : isNearly ? (
                            <><FileCheck className="h-4 w-4 text-[#D97706]" /> Missing Vault Document Required</>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                          <Link
                            to={`/tracking?scheme=${scheme.scheme_slug}` as any}
                            className="flex-1 sm:flex-initial h-11 px-4 rounded-xl bg-[#DCFCE7] hover:bg-[#bbf7d0] text-[#166534] border border-[#BBF7D0] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileCheck className="h-4 w-4" />
                            <span>Log & Track Record</span>
                          </Link>

                          {is100 && scheme.application_url && (
                            <a href={scheme.application_url} target="_blank" rel="noreferrer" className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95">
                              <span>Official Portal</span> <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Detailed Action Terminal (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24 pb-12">
            <aside className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#0E6245]" />
                  <h3 className="text-lg font-black text-slate-900">What Happens Next</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#E2E7FF] text-[#0E6245] text-[10px] font-bold border border-[#E2E7FF]">3 Quick Steps</span>
              </div>

              <div className="space-y-4 pt-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0]">
                  <div className="w-8 h-8 rounded-full bg-[#0E6245] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0 shadow-sm">1</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">Apply on Official Portal</p>
                      <span className="font-mono text-[10px] text-[#0E6245] font-bold">~2 mins</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">Visit the official central/state portal link to complete your application.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-mono text-xs font-bold shrink-0">2</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">Log Application Record</p>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">Save your self-reported application acknowledgment in Scheme AI for personal tracking.</p>
                    <Link to="/tracking" className="mt-3 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#0E6245] text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
                      Open Application Log <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-mono text-xs font-bold shrink-0">3</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">Vault Document Security</p>
                      <span className="font-mono text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">Vault</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">Ensure required documents remain uploaded in your Citizen Vault for quick access.</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>

        </section>
      </div>
    </AppLayout>
  )
}
