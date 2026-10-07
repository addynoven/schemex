'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { setCitizenToken } from '@/core'
import { authRepository } from '../repositories'

interface LoginFormProps {
  activeTab?: 'login' | 'signup'
}

export function LoginForm({ activeTab = 'login' }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (activeTab === 'signup') {
        const res = await authRepository.register({ email, password, phone: '+919876543210' })
        if (res.ok) {
          window.dispatchEvent(new Event('scheme:auth-changed'))
          router.push('/')
          return
        }
      }

      const res = await authRepository.login({ email, password })
      if (res.ok && res.data.access_token) {
        setCitizenToken(res.data.access_token)
        if (res.data.refresh_token) {
          localStorage.setItem('scheme_citizen_refresh', res.data.refresh_token)
        }
        window.dispatchEvent(new Event('scheme:auth-changed'))
        router.push('/')
      } else {
        setError(!res.ok ? res.error.message : 'Invalid email or password')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to receive a password reset link.')
      return
    }
    setError(null)
    setLoading(true)
    const success = await authRepository.sendPasswordReset(email.trim())
    setLoading(false)
    if (success) {
      setResetSent(true)
    } else {
      setError('Could not send password reset email. Please verify the email address.')
    }
  }

  return (
    <div className="font-sans">
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {resetSent && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] text-xs font-bold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
          <span>Password reset email sent! Check your inbox.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Stacked Input Container Card */}
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100 bg-white">

          {/* Input 1: Email Address */}
          <div className="relative px-4 pt-2.5 pb-2 border-l-4 border-l-[#ff2d55] bg-white transition-colors focus-within:bg-emerald-50/20">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider" htmlFor="email-input">
              Email Address
            </label>
            <div className="mt-0.5 flex items-center justify-between">
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-0 border-0 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 bg-transparent focus:outline-none"
              />
              {email && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#DCFCE7] text-[#166534] shrink-0" title="Valid email format">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                </span>
              )}
            </div>
          </div>

          {/* Input 2: Password */}
          <div className="relative px-4 pt-2.5 pb-2.5 bg-white transition-colors focus-within:bg-emerald-50/20">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider" htmlFor="password-input">
                Password
              </label>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-0 border-0 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>

        {/* Remember Me & Forgot Password Links */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-[#0e6245] focus:ring-[#0e6245]"
            />
            <span>Remember this device</span>
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="font-bold text-slate-500 hover:text-[#0e6245] transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-6 bg-black hover:bg-slate-900 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{activeTab === 'signup' ? 'Sign Up' : 'Login'}</span>
                <span className="text-[#A6F4B5]">→</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
