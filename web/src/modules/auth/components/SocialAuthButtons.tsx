'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { authRepository } from '../repositories'

export function SocialAuthButtons() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const user = await authRepository.loginWithGoogle()
      if (user) {
        window.dispatchEvent(new Event('scheme:auth-changed'))
        router.push('/')
      }
    } catch (err: unknown) {
      console.error('Firebase Google login error:', err)
      const errStr = err instanceof Error ? err.message : String(err)
      const errCode = (err as any)?.code || ''
      if (errStr.includes('popup-closed-by-user') || errCode === 'auth/popup-closed-by-user' || errStr.includes('cancelled')) {
        setErrorMessage('Sign-in popup was closed before completion. Please try again.')
      } else if (errStr.includes('unauthorized-domain') || errCode === 'auth/unauthorized-domain') {
        setErrorMessage('Domain authorization in progress. Please refresh in a few seconds.')
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Unable to connect to Google Auth. Please check your connection and retry.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-3">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium leading-relaxed animate-in fade-in duration-200"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3.5 py-3.5 px-5 rounded-2xl bg-white dark:bg-[#102219] hover:bg-slate-50 dark:hover:bg-[#162e22] active:bg-slate-100/80 dark:active:bg-[#0d1c14] border border-slate-300 dark:border-emerald-800/50 hover:border-slate-400 dark:hover:border-emerald-700/70 text-slate-800 dark:text-slate-100 font-semibold text-sm shadow-xs hover:shadow-sm active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e6245]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-[#0e6245] dark:text-emerald-400" />
            <span className="text-slate-700 dark:text-slate-200">Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="tracking-tight">Continue with Google</span>
          </>
        )}
      </button>
    </div>
  )
}
