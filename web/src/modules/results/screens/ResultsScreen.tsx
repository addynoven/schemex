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
import {
  NbButton,
  NbCard,
  NbBadge,
} from '@/core/design-system/Neubrutalist'

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
        <div className="max-w-xl mx-auto py-16 px-4">
          <NbCard className="p-8 text-center flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-black/40 dark:text-white/40 mb-2" />
            <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">No Evaluation Found</h2>
            <p className="text-xs text-black/70 dark:text-white/70 font-medium">
              Please fill out the eligibility form first to see your personalized scheme matches.
            </p>
            <Link to="/check" className="mt-2">
              <NbButton nbVariant="primary" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Start Eligibility Check</span>
              </NbButton>
            </Link>
          </NbCard>
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
      <div className="flex flex-col w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans gap-8">

        {/* 1. Pipeline Audit & Breadcrumb Tracker */}
        <NbCard className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b-2 border-black dark:border-emerald-500/30">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <NbBadge nbVariant="emerald" className="gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping" />
                  Verified Citizen Match
                </NbBadge>
                <NbBadge nbVariant="outline">
                  {profile?.district || 'Hassan'}, {profile?.state || 'Karnataka'}
                </NbBadge>
                <NbBadge nbVariant="outline" className="font-mono text-[11px]">
                  ID: KA-HSN-99824
                </NbBadge>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black dark:text-white tracking-tight leading-tight">
                You qualify for <span className="text-emerald-600 dark:text-emerald-400">{report.eligible_count} schemes</span>
              </h1>
              <p className="text-sm text-black/75 dark:text-white/75 max-w-3xl font-medium leading-relaxed">
                We compared your verified profile with official state & central welfare rules. All required criteria are matched with zero pending paperwork.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <NbBadge nbVariant="emerald" className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready to Claim Immediately
                </NbBadge>
                <NbBadge nbVariant="outline" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Zero Complex Paperwork
                </NbBadge>
                <NbBadge nbVariant="outline" className="gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Direct to Bank DBT
                </NbBadge>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 w-full lg:w-auto">
              <Link to="/check">
                <NbButton nbVariant="outline" className="gap-2 w-full lg:w-auto">
                  <RotateCcw className="h-4 w-4 text-black/60 dark:text-white/60" />
                  <span>Edit Profile Facts</span>
                </NbButton>
              </Link>
            </div>
          </div>
          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-black/70 dark:text-white/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
              <span>Eligibility audit complete ({report.total_evaluated} schemes processed)</span>
            </div>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">Status: Ready for Instant Disbursement</span>
          </div>
        </NbCard>

        {/* 2. High-Impact Welfare Scoreboard */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NbCard
            onClick={() => setActiveTab('eligible')}
            className={`p-6 transition-all flex flex-col justify-between cursor-pointer group ${
              activeTab === 'eligible'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-black dark:border-emerald-500 shadow-[4px_4px_0px_#000]'
                : 'hover:translate-x-[-1px] hover:translate-y-[-1px]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${activeTab === 'eligible' ? 'text-emerald-800 dark:text-emerald-300' : 'text-black/60 dark:text-white/60'}`}>Ready to Claim Now</span>
              <div className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center ${activeTab === 'eligible' ? 'bg-emerald-400 text-black shadow-[2px_2px_0px_#000]' : 'bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-white'}`}>
                <BadgeCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="my-4">
              <div className="text-3xl font-black text-black dark:text-white">{report.eligible_count} <span className="text-xl text-emerald-600 dark:text-emerald-400">Schemes</span></div>
              <p className="text-xs text-black/70 dark:text-white/70 mt-1 font-medium">100% eligibility confirmed. Zero missing papers.</p>
            </div>
            <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 pt-3 border-t-2 border-black/10 dark:border-white/10 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 border border-black" /> Pre-filled & ready</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </NbCard>

          <NbCard
            onClick={() => setActiveTab('nearly_eligible')}
            className={`p-6 transition-all flex flex-col justify-between cursor-pointer group ${
              activeTab === 'nearly_eligible'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-black dark:border-amber-500 shadow-[4px_4px_0px_#000]'
                : 'hover:translate-x-[-1px] hover:translate-y-[-1px]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${activeTab === 'nearly_eligible' ? 'text-amber-800 dark:text-amber-300' : 'text-black/60 dark:text-white/60'}`}>Unlock With 1 Doc</span>
              <div className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center ${activeTab === 'nearly_eligible' ? 'bg-amber-400 text-black shadow-[2px_2px_0px_#000]' : 'bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-white'}`}>
                <FileCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="my-4">
              <div className="text-3xl font-black text-amber-700 dark:text-amber-400">{report.nearly_eligible_count} <span className="text-xl text-black dark:text-white">Schemes</span></div>
              <p className="text-xs text-black/70 dark:text-white/70 mt-1 font-medium">Potential unlockable with missing vault document.</p>
            </div>
            <div className="text-xs font-black text-amber-700 dark:text-amber-400 pt-3 border-t-2 border-black/10 dark:border-white/10 flex items-center justify-between">
              <span>Instant 1-Click Vault Sync</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </NbCard>

          <NbCard
            onClick={() => setActiveTab('all')}
            className={`p-6 transition-all flex flex-col justify-between cursor-pointer group ${
              activeTab === 'all'
                ? 'bg-[#F4EFEA] dark:bg-[#0B120E] border-black dark:border-white/40 shadow-[4px_4px_0px_#000]'
                : 'hover:translate-x-[-1px] hover:translate-y-[-1px]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${activeTab === 'all' ? 'text-black dark:text-white' : 'text-black/60 dark:text-white/60'}`}>All Evaluated Schemes</span>
              <div className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center ${activeTab === 'all' ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_#000]' : 'bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-white'}`}>
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
            <div className="my-4">
              <div className="text-3xl font-black text-black dark:text-white">{report.total_evaluated}</div>
              <p className="text-xs text-black/70 dark:text-white/70 mt-1 font-medium">Full diagnostic breakdown of all evaluated criteria.</p>
            </div>
            <div className="text-xs font-black text-black/70 dark:text-white/70 pt-3 border-t-2 border-black/10 dark:border-white/10 flex items-center justify-between">
              <span>View full audit logs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </NbCard>
        </section>

        {/* 3. Main Master Split Workspace */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Matched Scheme Cards (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {activeTab === 'eligible' && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                  {activeTab === 'nearly_eligible' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                  {activeTab === 'all' && <ShieldAlert className="h-5 w-5 text-black/60 dark:text-white/60" />}
                  <h2 className="text-lg font-black text-black dark:text-white uppercase tracking-wider">
                    {activeTab === 'eligible' ? 'Ready to Claim Immediately' : activeTab === 'nearly_eligible' ? 'Nearly Eligible Schemes' : 'All Evaluated Schemes'} ({displayedSchemes.length})
                  </h2>
                </div>
                {activeTab === 'eligible' && (
                  <NbBadge nbVariant="emerald" className="text-[10px]">
                    Zero Pending Blockers
                  </NbBadge>
                )}
              </div>

              {displayedSchemes.length === 0 ? (
                <NbCard className="p-12 text-center">
                  <p className="text-black/60 dark:text-white/60 text-xs font-bold">No schemes in this category.</p>
                </NbCard>
              ) : (
                displayedSchemes.map((scheme) => {
                  const is100 = scheme.is_eligible;
                  const isNearly = scheme.status === 'nearly_eligible';

                  return (
                    <NbCard key={scheme.scheme_id} className="p-6 sm:p-7 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000] ${is100 ? 'bg-emerald-400 text-black' : isNearly ? 'bg-amber-400 text-black' : 'bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-white'}`}>
                            <Landmark className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {is100 ? (
                                <NbBadge nbVariant="emerald" className="text-[10px]">
                                  100% Eligible
                                </NbBadge>
                              ) : isNearly ? (
                                <NbBadge nbVariant="amber" className="text-[10px]">
                                  {scheme.match_percentage}% Match
                                </NbBadge>
                              ) : (
                                <NbBadge nbVariant="rose" className="text-[10px]">
                                  Ineligible
                                </NbBadge>
                              )}
                              <NbBadge nbVariant="outline" className="text-[10px]">
                                {scheme.state === 'ALL_INDIA' ? 'National Scheme' : scheme.state}
                              </NbBadge>
                            </div>
                            <h3 className="text-lg font-black text-black dark:text-white leading-tight">{scheme.scheme_name}</h3>
                            <p className="text-xs text-black/60 dark:text-white/60 font-bold mt-1">{scheme.ministry}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#F4EFEA] dark:bg-[#0B120E] p-4 rounded-xl border-2 border-black dark:border-emerald-500/40">
                        <p className="text-xs font-semibold text-black/80 dark:text-white/80 leading-relaxed">
                          {scheme.summary_reason}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {scheme.passed_criteria.map((c) => (
                          <span key={c.field} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border border-black dark:border-emerald-500 text-black dark:text-emerald-300 text-[11px] font-bold">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            {c.reason}
                          </span>
                        ))}
                        {scheme.failed_criteria.map((c) => (
                          <span key={c.field} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/40 border border-black dark:border-rose-500 text-black dark:text-rose-300 text-[11px] font-bold">
                            <AlertCircle className="h-3 w-3 text-rose-600" />
                            {c.reason}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2 pt-4 border-t-2 border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400">
                          {is100 ? (
                            <><Sparkles className="h-4 w-4 text-amber-500" /> Form Pre-filled • Ready to Apply</>
                          ) : isNearly ? (
                            <><FileCheck className="h-4 w-4 text-amber-600" /> Missing Vault Document Required</>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                          <Link to={`/tracking?scheme=${scheme.scheme_slug}` as any}>
                            <NbButton nbVariant="outline" size="sm" className="gap-1.5 text-xs py-1">
                              <FileCheck className="h-3.5 w-3.5" />
                              <span>Log Record</span>
                            </NbButton>
                          </Link>

                          {is100 && scheme.application_url && (
                            <a href={scheme.application_url} target="_blank" rel="noreferrer">
                              <NbButton nbVariant="primary" size="sm" className="gap-1.5 text-xs py-1">
                                <span>Official Portal</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </NbButton>
                            </a>
                          )}
                        </div>
                      </div>
                    </NbCard>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Detailed Action Terminal (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24 pb-12">
            <NbCard className="p-6 sm:p-7">
              <div className="flex items-center justify-between pb-4 border-b-2 border-black dark:border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-black text-black dark:text-white uppercase tracking-wider">What Happens Next</h3>
                </div>
                <NbBadge nbVariant="sky" className="text-[10px]">
                  3 Quick Steps
                </NbBadge>
              </div>

              <div className="space-y-3 pt-5">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-black dark:border-emerald-500/40 shadow-[2px_2px_0px_#000]">
                  <div className="w-7 h-7 rounded-lg bg-emerald-400 text-black border border-black flex items-center justify-center font-mono text-xs font-black shrink-0">1</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-black dark:text-white">Apply on Official Portal</p>
                      <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">~2 mins</span>
                    </div>
                    <p className="text-[11px] text-black/70 dark:text-white/70 mt-0.5 font-medium leading-relaxed">Visit the official portal link to complete your application.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500/40 shadow-[2px_2px_0px_#000]">
                  <div className="w-7 h-7 rounded-lg bg-[#FFFDF9] dark:bg-[#131F18] border border-black text-black dark:text-white flex items-center justify-center font-mono text-xs font-black shrink-0">2</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-black dark:text-white">Log Application Record</p>
                    </div>
                    <p className="text-[11px] text-black/70 dark:text-white/70 mt-0.5 font-medium leading-relaxed">Save your self-reported acknowledgment in Scheme AI for personal tracking.</p>
                    <Link to="/tracking" className="mt-2.5 inline-block">
                      <NbButton nbVariant="outline" size="sm" className="text-[11px] py-1 px-3 gap-1">
                        <span>Open Application Log</span>
                        <ArrowRight className="h-3 w-3" />
                      </NbButton>
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500/40 shadow-[2px_2px_0px_#000]">
                  <div className="w-7 h-7 rounded-lg bg-[#FFFDF9] dark:bg-[#131F18] border border-black text-black dark:text-white flex items-center justify-center font-mono text-xs font-black shrink-0">3</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-black dark:text-white">Vault Document Security</p>
                      <NbBadge nbVariant="outline" className="text-[10px] py-0 px-1.5">Vault</NbBadge>
                    </div>
                    <p className="text-[11px] text-black/70 dark:text-white/70 mt-0.5 font-medium leading-relaxed">Ensure required documents remain uploaded in your Citizen Vault for quick access.</p>
                  </div>
                </div>
              </div>
            </NbCard>
          </div>

        </section>
      </div>
    </AppLayout>
  )
}
