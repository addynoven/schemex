'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  MessageSquare,
  Send,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Sparkles,
  Phone,
  FileWarning,
  AlertTriangle,
  Info,
  User as UserIcon,
  HelpCircle,
  FileEdit,
  Building2,
  MapPin,
  Cloud,
  Gavel,
  CheckCircle2,
} from 'lucide-react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { AppLayout } from '@/components/layout/AppLayout'

export interface FaqItem {
  id: string
  question: string
  answer: string
  category: 'appeals' | 'documents' | 'dbt' | 'general'
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-dbt',
    question: 'My DBT installment shows "Failed / PFMS Rejected". What should I do?',
    answer:
      'Over 94% of payment failures occur because the bank account is either inactive or not mapped with the NPCI Aadhaar Payment Bridge. Follow these 2 steps:\n\n1. Verify NPCI Status: Check your bank account status directly on the NPCI / UIDAI dashboard or visit your branch.\n2. Instant Post Office Account (Alternative): If your commercial bank takes time, open an India Post Payments Bank (IPPB) DBT account at any local post office within 10 minutes. Payments will automatically route there.',
    category: 'dbt',
  },
  {
    id: 'faq-stuck',
    question: 'My application has been "Under Verification" for more than 15 days',
    answer:
      'Under the Sakala Services Act, village administrative desks must process eligible applications within 21 working days. If your timeline has lapsed:\n\nUse the Quick Tracker on the right sidebar to copy your token, or click "Submit Petition". An automatic reminder notice will be triggered to the Taluk Tahsildar with an escalated 48-hour SLA deadline.',
    category: 'appeals',
  },
  {
    id: 'faq-docs',
    question: 'DigiLocker error or certificate name spelling mismatch',
    answer:
      'If your name spelling in your Aadhaar card differs slightly from your Caste/Income certificate or Land Record (RTC), government AI verification allows a gazette self-affidavit upload.\n\nYou do not need to cancel your application. Visit your nearest Seva Kendra or upload the self-declaration directly via your Citizen Vault settings.',
    category: 'documents',
  },
  {
    id: 'faq-lang',
    question: 'Can I submit complaints and speak in Kannada, Telugu, Tamil or Hindi?',
    answer:
      'Yes. Both our toll-free phone officers and ticket systems process petitions in all 14 official regional Indian languages. When calling 1800-115-526, press 2 for Kannada, 3 for Hindi, 4 for Telugu, or 5 for Tamil.',
    category: 'general',
  },
]

export function SupportScreen() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'dbt' | 'appeals' | 'documents'>('all')

  const [ticketModalOpen, setTicketModalOpen] = useState(false)

  const filteredFaqs = FAQ_DATA.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) {
      if (activeCategory === 'general' as string) return true // General shows everything in this mock
      return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
        {/* Main Container */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

          {/* Top Hero Banner */}
          <div className="rounded-3xl bg-[#004831] p-8 sm:p-10 shadow-md border border-[#0E6245] relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6245] text-white text-xs font-bold mb-4 border border-[#166534]">
                  <span className="w-2 h-2 rounded-full bg-[#A6F4B5] animate-pulse" />
                  <span>Official Government Citizen Assistance Desk</span>
                  <span className="opacity-60">•</span>
                  <span className="font-mono text-[#A6F4B5]">24x7 Helpline Active</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                  How can we help resolve your issue today?
                </h1>
                <p className="text-[#8BD6B1] text-sm sm:text-base leading-relaxed font-medium">
                  Direct help for stopped DBT payments, stuck applications, e-KYC mismatches, or formal grievances. No waiting in lines.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <a
                  href="tel:1800115526"
                  className="px-6 py-3.5 rounded-xl bg-[#1F6C3A] hover:bg-[#A4F1B2] text-white hover:text-[#24703E] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Phone className="h-5 w-5" />
                  <span>Call Toll-Free 1800-115-526</span>
                </a>
                <button
                  onClick={() => setTicketModalOpen(true)}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#004831] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>File Urgent Grievance</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panic & Urgent Triage Row */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Info className="h-5 w-5 text-rose-600 font-bold" />
                <h2 className="text-base font-black uppercase tracking-wide">
                  Immediate Assistance & Quick Triage
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold">Select what best describes your situation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Triage 1 */}
              <button className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-[#0E6245] text-left flex flex-col justify-between shadow-xs hover:shadow-md transition-all group cursor-pointer h-full">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <span className="font-bold text-xl">₹</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 font-mono">Urgent</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0E6245] transition-colors mb-1">
                    DBT / Money Not Received
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Payment delayed, bank NPCI unlinked, or installment missing.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0E6245]">
                  <span>Fix bank DBT link</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Triage 2 */}
              <button className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-[#0E6245] text-left flex flex-col justify-between shadow-xs hover:shadow-md transition-all group cursor-pointer h-full">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#004831] flex items-center justify-center">
                      <FileWarning className="h-6 w-6" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 font-mono">Appeals</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0E6245] transition-colors mb-1">
                    Application Stuck or Rejected
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Pending verification for &gt;15 days or rejected with objection.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0E6245]">
                  <span>Check objection reason</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Triage 3 */}
              <button className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-[#0E6245] text-left flex flex-col justify-between shadow-xs hover:shadow-md transition-all group cursor-pointer h-full">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-[#166534] font-mono">DigiLocker</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0E6245] transition-colors mb-1">
                    Document / e-KYC Issue
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Name mismatch on Aadhaar, expired income certificate, or RTC error.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0E6245]">
                  <span>Correct my documents</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Triage 4 */}
              <div className="p-5 rounded-2xl bg-[#E2E7FF] border-2 border-indigo-200 text-left flex flex-col justify-between shadow-xs group h-full">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#004831] text-white flex items-center justify-center">
                      <Headphones className="h-6 w-6" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1F6C3A] text-white font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live Now
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Talk to a Live Officer
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Connect directly to an administrative desk in your local dialect.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-200/60 flex items-center justify-between text-xs font-bold text-[#0E6245]">
                  <a href="tel:1800115526" className="inline-flex items-center gap-1 hover:underline">
                    <Phone className="h-4 w-4" /> 1800-115-526
                  </a>
                  <span className="font-mono text-slate-500 text-[10px]">&lt; 1 min wait</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Support Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: FAQ Solutions */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              {/* 2x2 Official Resolution Channels */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-[#0E6245]" />
                  <span>Official Resolution Channels</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Helpline */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#0E6245] text-white flex items-center justify-center">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-900">National Helpline</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#1F6C3A] flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1F6C3A]" /> Available
                      </span>
                    </div>
                    <div className="text-xl font-bold font-mono text-[#0E6245] mb-1">1800-115-526</div>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Toll-free • Mon – Sat, 9:00 AM – 6:00 PM IST (Available in 14 languages)</p>
                    <a href="tel:1800115526" className="w-full py-2 rounded-xl bg-[#0E6245] text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-[#004831] transition-all">
                      <Phone className="h-3.5 w-3.5" /> Call Toll-Free
                    </a>
                  </div>

                  {/* WhatsApp Bot */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1F6C3A] text-white flex items-center justify-center">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-900">WhatsApp Bot</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 font-mono">Instant</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-[#1F6C3A] mb-1">+91 98765 43210</div>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Send certificate scans, track payments, and get automated receipt status.</p>
                    <a href="#" className="w-full py-2 rounded-xl bg-[#1F6C3A] text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-[#24703E] transition-all">
                      <Send className="h-3.5 w-3.5" /> Chat on WhatsApp
                    </a>
                  </div>

                  {/* Statutory Grievance */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#E2E7FF] text-[#0E6245] flex items-center justify-center">
                          <FileEdit className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-900">Grievance Portal</span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-mono">48-hr SLA</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 mb-1">File Official Petition</div>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Legally mandated portal review by the District Nodal Officer within 48 hours.</p>
                    <button onClick={() => setTicketModalOpen(true)} className="w-full py-2 rounded-xl bg-white text-[#0E6245] border border-slate-200 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-100 transition-all cursor-pointer">
                      <FileEdit className="h-3.5 w-3.5" /> Submit Petition Ticket
                    </button>
                  </div>

                  {/* Offline Seva Kendra */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#E2E7FF] text-[#0E6245] flex items-center justify-center">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-900">Offline Kendra</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#1F6C3A] font-mono">1.4 km away</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 mb-1">Grama One / CSC</div>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Biometric Aadhaar authentication, paper scanning, and counter assistance.</p>
                    <a href="#" className="w-full py-2 rounded-xl bg-white text-[#0E6245] border border-slate-200 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-100 transition-all">
                      <MapPin className="h-3.5 w-3.5" /> View Center Details
                    </a>
                  </div>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Frequently Encountered Problems & Solutions
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Instant answers verified by the Department of Civic Welfare
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button onClick={() => setActiveCategory('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeCategory === 'all' ? 'bg-[#0E6245] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>All</button>
                    <button onClick={() => setActiveCategory('dbt')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeCategory === 'dbt' ? 'bg-[#0E6245] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>DBT / Bank</button>
                    <button onClick={() => setActiveCategory('appeals')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeCategory === 'appeals' ? 'bg-[#0E6245] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Appeals</button>
                    <button onClick={() => setActiveCategory('documents')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeCategory === 'documents' ? 'bg-[#0E6245] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Documents</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredFaqs.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-500 font-medium">
                      No matching help topics found. Try another search query.
                    </div>
                  ) : (
                    <Accordion type="single" collapsible defaultValue="faq-dbt" className="space-y-3">
                      {filteredFaqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id} className="border border-slate-200 bg-slate-50 rounded-2xl px-5 overflow-hidden">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-3 text-left">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${faq.category === 'dbt' ? 'bg-rose-500' : faq.category === 'appeals' ? 'bg-amber-500' : 'bg-[#0E6245]'}`} />
                              <span className="font-bold text-slate-900 text-sm">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-5 border-t border-slate-200/60">
                            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                              {faq.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Quick Status Lookup */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              <div className="bg-white rounded-3xl p-6 border-2 border-[#0E6245]/20 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-[#0E6245]" />
                  <span className="text-xs font-black text-[#0E6245] uppercase tracking-wider">Instant Status Lookup</span>
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">Track Your Application</h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">Enter acknowledgement number or registered mobile to view live officer remarks.</p>

                <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="text"
                    placeholder="e.g. IN-8849-KA or mobile"
                    className="w-full h-11 px-4 bg-slate-50 rounded-xl text-xs font-mono text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0E6245] font-bold"
                    defaultValue="IN-8849-KA"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => alert("Found application KAR-2024-8849: Verification completed by Grama Panchayat. Forwarded to Taluk Treasury for disbursement.")}
                    className="w-full py-3 rounded-xl bg-[#004831] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-[#0E6245] transition-all cursor-pointer"
                  >
                    <Search className="h-4 w-4" /> Check Live Status
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> PFMS Gate Synchronized
                  </span>
                  <span className="font-mono">Today, 09:30 AM</span>
                </div>
              </div>

              {/* Assigned Local Desk */}
              <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-200 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-black text-[#0E6245] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> Your Assigned Field Desk
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">Ward #14</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <UserIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black text-slate-900 truncate">Shri. Ramesh Gowda</span>
                    <span className="text-xs text-slate-500 font-semibold truncate">Village Administrative Officer (VAO)</span>
                    <span className="text-[10px] text-[#0E6245] font-bold font-mono mt-0.5">Duty Hours: 10 AM – 5 PM</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span>Hassan Grama One Center</span>
                    <span className="text-[#0E6245] font-mono font-bold text-[10px]">1.4 km away</span>
                  </div>
                  <p className="leading-relaxed">
                    Salagame Road, Opposite Sub-Registrar Office, Hassan, Karnataka - 573201
                  </p>
                  <div className="mt-1 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-mono font-bold text-slate-900">Ph: 08172-268142</span>
                    <a href="#" className="text-[#0E6245] font-bold inline-flex items-center gap-1 hover:underline">
                      Directions
                    </a>
                  </div>
                </div>
              </div>

              {/* Emergency Escalation */}
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 flex items-start gap-3 shadow-xs">
                <ShieldCheck className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex flex-col text-xs leading-relaxed">
                  <span className="font-bold text-sm text-rose-900 mb-0.5">Emergency National Escalation: 14449</span>
                  <span className="font-medium">For illegal bribe demands, fraudulent scheme agents, or urgent distress escalations. Calls are recorded directly for the Chief Minister's Grievance Cell.</span>
                </div>
              </div>

              {/* Document Checklist Keep Handy */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col gap-2 text-xs text-slate-600 shadow-xs font-medium">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Keep Handy Before Calling</span>
                <div className="space-y-1.5 mt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F6C3A]" />
                    <span>12-digit Aadhaar Number or linked phone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F6C3A]" />
                    <span>Application Acknowledgment Slip (ACK)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F6C3A]" />
                    <span>Bank Passbook front page or IFSC Code</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* Subtle Trust Footer */}
        <div className="pt-4 pb-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 font-bold"><ShieldCheck className="h-4 w-4 text-[#0E6245]" /> MeitY 256-bit Secure</span>
            <span className="inline-flex items-center gap-1.5 font-bold"><Cloud className="h-4 w-4 text-[#0E6245]" /> DigiLocker Integrated</span>
            <span className="inline-flex items-center gap-1.5 font-bold"><Gavel className="h-4 w-4 text-[#0E6245]" /> Sakala Act Guaranteed SLA</span>
          </div>
          <div className="font-mono font-bold text-slate-400">
            REF: IN-2025-HLP-8849 • Citizen data protected under DPDPA 2023
          </div>
        </div>
      </div>

      {/* Grievance Ticket Slideout Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">File a Support Ticket</h3>
                  <span className="text-xs font-bold text-slate-500">Central Civic Grievance Redressal</span>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                alert('Ticket submitted successfully! Ref: GRV-2025-9982.')
                setTicketModalOpen(false)
              }}
              className="flex flex-col gap-4 font-medium"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Scheme or Service</label>
                <select className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-1 focus:ring-[#0E6245]">
                  <option>PM-Kisan Samman Nidhi (Agriculture)</option>
                  <option>Gruha Lakshmi DBT (Direct Financial Assistance)</option>
                  <option>Pradhan Mantri Awas Yojana (Housing)</option>
                  <option>Ayushman Bharat PM-JAY (Health)</option>
                  <option>DigiLocker / Document Vault Token Error</option>
                  <option>Other Civic Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Application Ref No. (Optional)</label>
                <input
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-1 focus:ring-[#0E6245]"
                  placeholder="e.g. IN-8849-KA or ACK-2024-9182"
                  type="text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description of Issue</label>
                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-1 focus:ring-[#0E6245] min-h-[100px]"
                  placeholder="Please describe what happened, any error messages, or dates..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#0E6245] text-white text-xs font-bold hover:bg-[#004831] shadow-xs transition-colors cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
