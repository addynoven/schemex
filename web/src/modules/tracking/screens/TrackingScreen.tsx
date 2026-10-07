'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Lock,
  Download,
  Share2,
  Printer,
  Copy,
  BadgeCheck,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  Check,
  Building2,
  User as UserIcon,
  Phone,
  FileCheck,
  Landmark,
  X,
  FileText,
  MapPin,
  Leaf,
  ExternalLink,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { getSavedCitizenProfile, getCitizenUser } from '@/lib/session'

export function TrackingScreen({ ackId }: { ackId?: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Read saved profile and user session safely after client mount to prevent SSR hydration mismatches
  const profile = mounted ? getSavedCitizenProfile() : null
  const activeUser = mounted ? getCitizenUser() : null
  const citizenName =
    mounted && activeUser
      ? activeUser?.profile?.full_name ||
        activeUser?.full_name ||
        activeUser?.displayName ||
        'Rajesh Kumar Sharma'
      : 'Rajesh Kumar Sharma'

  const referenceId = ackId || 'ACK-PMK-2024-KA-88912'
  const [copied, setCopied] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [applicationDate, setApplicationDate] = useState('07 Oct 2026')

  useEffect(() => {
    if (mounted) {
      setApplicationDate(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }))
    }
  }, [mounted])

  const handleCopyAck = () => {
    navigator.clipboard?.writeText(referenceId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleActionToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3800)
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">

        {/* Toast Notification */}
        <div className={`fixed bottom-6 right-8 z-50 flex items-center gap-3 bg-[#0E6245] text-white px-5 py-4 rounded-xl shadow-xl transition-all duration-300 transform ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
          <CheckCircle2 className="h-6 w-6 text-[#A4F1B2]" />
          <div className="flex flex-col">
            <span className="text-sm font-bold">{toastMessage}</span>
            <span className="text-[11px] text-emerald-100 font-medium">Recorded in your local citizen application log</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-emerald-200 hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

          {/* 1. STAGE PROGRESS TRACKER */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between overflow-x-auto pb-2 lg:pb-0 gap-3 scrollbar-none">

              {/* Step 01 */}
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#166534] flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider line-through">01 Demographics</span>
              </div>
              <div className="h-0.5 w-6 bg-[#DCFCE7] shrink-0" />

              {/* Step 02 */}
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#166534] flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider line-through">02 Eligibility Check</span>
              </div>
              <div className="h-0.5 w-6 bg-[#DCFCE7] shrink-0" />

              {/* Step 03 */}
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#166534] flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider line-through">03 Official Portal Link</span>
              </div>
              <div className="h-0.5 w-6 bg-[#0E6245] shrink-0" />

              {/* Step 04 Active */}
              <div className="flex items-center gap-2 shrink-0 bg-[#DCFCE7] px-3.5 py-1.5 rounded-full border border-[#BBF7D0]">
                <div className="w-7 h-7 rounded-full bg-[#0E6245] text-white flex items-center justify-center font-mono text-xs font-black">
                  04
                </div>
                <div className="flex flex-col pr-1">
                  <span className="text-[10px] text-[#0E6245] font-black uppercase tracking-wider">Citizen Record</span>
                  <span className="text-xs font-extrabold text-[#166534]">Self-Reported Application Saved</span>
                </div>
              </div>

            </div>
          </section>

          {/* 2. MAIN HERO BANNER & RECEIPT HEADER */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="flex flex-col gap-6 relative z-10">

              {/* Verification Pills */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#DCFCE7] text-[#166534] font-bold text-xs border border-[#BBF7D0]">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                  CITIZEN SELF-REPORTED APPLICATION
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                  RECORDED ON: {applicationDate}
                </span>
              </div>

              {/* Title & Tracking Reference */}
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Application Logged in Citizen Record
                </h1>
                <p className="text-sm text-slate-600 font-medium max-w-2xl">
                  You marked this scheme as applied on the official portal. Scheme AI keeps this acknowledgment logged for your personal records and follow-ups.
                </p>
                <div className="flex flex-wrap items-center gap-2 font-mono text-sm font-bold text-[#0E6245] mt-1">
                  <span>Record Reference ID:</span>
                  <span onClick={handleCopyAck} className="bg-slate-100 text-slate-900 px-3 py-1 rounded-xl tracking-wider select-all cursor-pointer border border-slate-200">
                    #{referenceId}
                  </span>
                  <button onClick={handleCopyAck} className="text-slate-500 hover:text-[#0E6245] transition-colors cursor-pointer" title="Copy Reference">
                    <Copy className="h-4 w-4" />
                  </button>
                  {copied && <span className="text-xs text-[#16A34A] font-sans font-bold">Copied to clipboard!</span>}
                </div>
              </div>

              {/* Profile Meta Bar */}
              <div className="flex flex-wrap items-center gap-3 py-3 px-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-[#0E6245]" />
                  <span>{citizenName}</span>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#0E6245]" />
                  <span>{profile?.district || 'Hassan'}, {profile?.state || 'Karnataka'}</span>
                </div>
              </div>

              {/* Action Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => handleActionToast("Record saved as PDF")} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0E6245] text-white font-bold text-xs hover:bg-[#004831] transition-all shadow-sm cursor-pointer active:scale-95">
                    <Download className="h-4 w-4" />
                    <span>Download Record (PDF)</span>
                  </button>
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer active:scale-95 border border-slate-200">
                    <Printer className="h-4 w-4" />
                    <span>Print Record</span>
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* 3. MAIN CONTENT: TWO-COLUMN SPLIT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: Application Record Details (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              <article className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col gap-6">

                {/* Ministry & Scheme Heading */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0E6245] shadow-xs shrink-0">
                      <Leaf className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ministry of Agriculture & Farmers Welfare</span>
                      <span className="text-lg font-black text-slate-900">PM Kisan Samman Nidhi</span>
                    </div>
                  </div>
                  <a
                    href="https://pmkisan.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs font-bold text-[#0E6245] px-3 py-1.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>Check Official Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Citizen Application Checklist Timeline */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-900">Citizen Application Log & Next Steps</h2>
                    <span className="text-xs text-slate-500 font-bold">Self-Reported Checklist</span>
                  </div>

                  {/* Stepper List */}
                  <div className="relative pl-8 flex flex-col gap-6 pt-2">
                    <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-200" />

                    {/* Step 1: Marked Applied */}
                    <div className="relative flex items-start gap-4">
                      <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-sm font-bold text-slate-900">Marked as Applied by Citizen</span>
                          <span className="font-mono text-[11px] text-[#166534] font-bold">{applicationDate}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                          You confirmed submitting your application on the official government website.
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Vault Documents */}
                    <div className="relative flex items-start gap-4">
                      <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-sm font-bold text-slate-900">Vault Documents Attached</span>
                          <span className="font-mono text-[11px] text-[#166534] font-bold">2 Documents</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                          Aadhaar Card and Bank Passbook records are stored safely in your Citizen Vault.
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Official Verification */}
                    <div className="relative flex items-start gap-4">
                      <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-white shadow-xs animate-pulse">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col flex-1 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-sm font-bold text-amber-900">Check Official Portal Status</span>
                          <span className="font-mono text-[11px] text-amber-800 font-bold">Recommended Action</span>
                        </div>
                        <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
                          To check your live official processing status, visit the official government scheme portal directly using your registration reference number.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              </article>

            </div>

            {/* RIGHT COLUMN: Field Desk Contact (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
              <aside className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#0E6245]" />
                    <h3 className="text-lg font-black text-slate-900">Local Desk Contact</h3>
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <UserIcon className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-slate-900 truncate">Shri. Ramesh Gowda</span>
                      <span className="text-xs text-slate-500 font-semibold truncate">Village Administrative Officer (VAO)</span>
                      <span className="text-[10px] text-[#0E6245] font-bold font-mono mt-0.5">Hassan Ward #14</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs text-slate-600 font-medium">
                    <span className="font-bold text-slate-900">Hassan Grama One Center</span>
                    <p className="leading-relaxed">Salagame Road, Opposite Sub-Registrar Office, Hassan - 573201</p>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">Ph: 08172-268142</span>
                      <a href="tel:1800115526" className="text-[#0E6245] font-bold flex items-center gap-1 hover:underline">
                        <Phone className="h-3.5 w-3.5" /> Call Desk
                      </a>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

          </div>

        </main>
      </div>
    </AppLayout>
  )
}
