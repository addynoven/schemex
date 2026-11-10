'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Leaf,
  CheckCircle2,
  Lock,
  Cpu,
  ArrowUpRight,
} from 'lucide-react'
import { ThemeToggle } from '@/core'
import { SocialAuthButtons, CivicAuraCanvas } from '../components'

export function LoginScreen() {
  const cardContainerRef = useRef<HTMLDivElement | null>(null)
  const passCardRef = useRef<HTMLDivElement | null>(null)

  // 3D Perspective Tilt on the Sovereign Pass Card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!passCardRef.current || !cardContainerRef.current) return
    const rect = cardContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rx = (y / (rect.height / 2)) * -12
    const ry = (x / (rect.width / 2)) * 14
    passCardRef.current.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(16px)`
  }

  const handleMouseLeave = () => {
    if (!passCardRef.current) return
    passCardRef.current.style.transform =
      'perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
  }

  return (
    <div className="min-h-screen bg-[#f3f5f4] dark:bg-[#060e0a] text-slate-900 dark:text-slate-100 font-sans antialiased flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-[#0e6245] selection:text-white transition-colors duration-150">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      >
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-100/60 dark:bg-emerald-950/20 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -left-40 w-[620px] h-[620px] bg-amber-100/50 dark:bg-amber-950/15 rounded-full blur-3xl opacity-65" />
      </div>

      {/* Main Elevation Container (Split 44% / 56%) */}
      <main className="relative z-10 w-full max-w-[1260px] bg-white dark:bg-[#0a1711] rounded-3xl shadow-[0_32px_90px_-20px_rgba(14,98,69,0.22)] dark:shadow-[0_32px_100px_-20px_rgba(0,0,0,0.8)] border border-slate-200/90 dark:border-emerald-950/80 overflow-hidden flex flex-col lg:flex-row min-h-[700px] transition-colors duration-150">
        {/* LEFT COLUMN: Sovereign Authentication Panel (44% width) */}
        <section className="w-full lg:w-[44%] bg-white dark:bg-[#0a1711] p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative z-10 transition-colors duration-150">
          <div>
            {/* Top Sovereign Header */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-[#0e6245] flex items-center justify-center text-white shadow-xs group-hover:bg-[#0a4e37] transition-colors duration-150">
                  <Leaf className="h-5 w-5 fill-white" />
                </div>
                <div>
                  <span className="block text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
                    Scheme Navigator
                  </span>
                  <span className="block text-[10px] font-bold tracking-wider uppercase text-emerald-800 dark:text-emerald-400 mt-1">
                    Govt. of India • Public Good
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-[#0e6245] dark:text-emerald-300 text-[11px] font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0e6245] dark:text-emerald-400" />
                  <span>Sovereign Auth</span>
                </div>
              </div>
            </div>

            {/* Display Title & Purpose */}
            <div className="mb-7">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Sovereign Citizen Gateway
              </h1>
              <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-sm">
                Deterministic eligibility calculation across 4,160+ central and state welfare entitlements. Direct benefit transfer verification.
              </p>
            </div>

            {/* Google Single-Sign-On */}
            <div className="space-y-3.5 mb-8">
              <SocialAuthButtons />

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0e6245] dark:text-emerald-400 shrink-0" />
                <span>Single-click entry — zero passwords, zero OTP friction</span>
              </div>
            </div>

            {/* Structured Sovereign Data Governance Ledger */}
            <div className="border border-slate-200/90 dark:border-emerald-950/80 rounded-2xl p-4 bg-slate-50/70 dark:bg-[#0c1f16]/60 space-y-2.5 text-[11px] transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-emerald-950/60 pb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-[#0e6245] dark:text-emerald-400" />
                  Protocol Specification
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">SCHEME-AUTH-V2</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">Identity Mode</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Google OAuth 2.0</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">Citizen Scope</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Read-Only Profile</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">Data Standard</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">DPDP Act 2023</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">Document Vault</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">AES-256 Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Legal & Sovereign Security Badge */}
          <footer className="mt-8 pt-5 border-t border-slate-100 dark:border-emerald-950/60 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
            <p>
              By continuing, you accept Scheme Navigator&apos;s{' '}
              <Link
                href="/privacy"
                className="font-semibold text-slate-800 dark:text-slate-200 hover:text-[#0e6245] dark:hover:text-emerald-400 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="font-semibold text-slate-800 dark:text-slate-200 hover:text-[#0e6245] dark:hover:text-emerald-400 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 font-medium">
              <span>National Informatics Architecture</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                256-Bit TLS 1.3 Active
              </span>
            </div>
          </footer>
        </section>

        {/* RIGHT COLUMN: 3D Holographic Sovereign Entitlement Pass (56% width) */}
        <section
          ref={cardContainerRef}
          className="w-full lg:w-[56%] relative text-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden select-none bg-[#03150b] dark:bg-[#020d07]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Dynamic Guilloche Security Shader Background */}
          <CivicAuraCanvas />

          {/* Top Sovereign Bar */}
          <header className="relative z-20 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/20 text-emerald-200 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>National Entitlement Register</span>
            </div>
            <div className="text-[10px] font-mono tracking-widest text-emerald-300/80 uppercase">
              INDIA • PUBLIC INFRASTRUCTURE
            </div>
          </header>

          {/* Central 3D Sovereign Pass Card */}
          <div className="relative z-20 my-auto py-6 flex items-center justify-center">
            <div
              ref={passCardRef}
              className="w-full max-w-md rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-[#0c3c26]/90 via-[#072a1a]/95 to-[#041a10]/95 border border-white/25 backdrop-blur-md shadow-[0_25px_70px_-10px_rgba(0,0,0,0.7)] transition-transform duration-150 ease-out will-change-transform relative overflow-hidden"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Metallic Smart-Card Contact Chip & Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  {/* EMV Microchip SVG */}
                  <div className="w-11 h-9 rounded-md bg-gradient-to-br from-[#e6c85e] via-[#d4af37] to-[#aa8c2c] p-1 border border-amber-200/50 shadow-inner flex flex-col justify-between">
                    <div className="flex justify-between h-1.5">
                      <div className="w-2.5 h-full border-b border-r border-[#8b7324]" />
                      <div className="w-2.5 h-full border-b border-l border-[#8b7324]" />
                    </div>
                    <div className="flex justify-between h-1.5">
                      <div className="w-2.5 h-full border-t border-r border-[#8b7324]" />
                      <div className="w-2.5 h-full border-t border-l border-[#8b7324]" />
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono tracking-widest text-amber-300 font-bold uppercase">
                      Citizen Entitlement Pass
                    </span>
                    <span className="block text-xs font-bold text-white tracking-tight">
                      Scheme Navigator • Republic of India
                    </span>
                  </div>
                </div>

                <Cpu className="h-5 w-5 text-emerald-400/80 shrink-0" />
              </div>

              {/* Citizen Entitlement Micro-Ledger */}
              <div className="space-y-2.5 mb-5 font-mono text-[11px]">
                {/* Scheme 1 */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block font-sans text-xs font-bold text-white tracking-tight">
                      PM-KISAN Samman Nidhi
                    </span>
                    <span className="text-[10px] text-emerald-300">Direct Benefit Transfer • ₹6,000 / yr</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    ELIGIBLE
                  </span>
                </div>

                {/* Scheme 2 */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block font-sans text-xs font-bold text-white tracking-tight">
                      Ayushman Bharat (PM-JAY)
                    </span>
                    <span className="text-[10px] text-amber-300">Cashless Health Cover • ₹5,00,000</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>

                {/* Scheme 3 */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block font-sans text-xs font-bold text-white tracking-tight">
                      PM Surya Ghar (Muft Bijli)
                    </span>
                    <span className="text-[10px] text-emerald-300">Rooftop Solar Subsidy • Up to ₹78,000</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    PRE-APPROVED
                  </span>
                </div>
              </div>

              {/* Pass Security Strip & Status Seal */}
              <div className="flex items-center justify-between pt-3 border-t border-white/15 text-[10px] font-mono">
                <span className="text-white/70">UID: IND-8842-••••-9102</span>
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  DBT SYNCED
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Aggregate Entitlement Stats Bar */}
          <footer className="relative z-20 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/80">
            <div className="flex items-center gap-4">
              <div>
                <span className="block text-base font-black text-white leading-none">4,160+</span>
                <span className="text-[10px] text-emerald-200/80 font-medium">Synced Schemes</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div>
                <span className="block text-base font-black text-white leading-none">₹3.4L Cr</span>
                <span className="text-[10px] text-emerald-200/80 font-medium">DBT Monitored</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div>
                <span className="block text-base font-black text-white leading-none">100% Free</span>
                <span className="text-[10px] text-emerald-200/80 font-medium">Public Good</span>
              </div>
            </div>

            <Link
              href="/schemes"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-white transition-colors"
            >
              <span>Explore Scheme Catalog</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </footer>
        </section>
      </main>
    </div>
  )
}

