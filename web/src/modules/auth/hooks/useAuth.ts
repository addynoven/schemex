'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCitizenToken, getCitizenRefreshToken, clearCitizenToken, setCitizenToken, setCitizenRefreshToken } from '@/core'
import { authRepository } from '../repositories'
import { useAuthStore } from '../store'

export function useAuth() {
  const router = useRouter()
  const { user, setUser, clear } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  const checkSession = async () => {
    const token = getCitizenToken()
    const refreshToken = getCitizenRefreshToken()

    if (!token && !refreshToken) {
      clear()
      setIsLoading(false)
      return
    }

    // 1. Try existing access token first
    if (token) {
      const res = await authRepository.getMe()
      if (res.ok) {
        setUser(res.data)
        setIsLoading(false)
        return
      }
    }

    // 2. Access token expired - perform seamless rolling refresh
    if (refreshToken) {
      try {
        const refRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (refRes.ok) {
          const data = await refRes.json()
          if (data.access_token) {
            setCitizenToken(data.access_token)
            if (data.refresh_token) {
              setCitizenRefreshToken(data.refresh_token)
            }
            const meRes = await authRepository.getMe()
            if (meRes.ok) {
              setUser(meRes.data)
              setIsLoading(false)
              return
            }
          }
        }
      } catch (err) {
        // Transient network glitch: do not aggressively log out the citizen
        console.warn('⚠️ [useAuth] Session refresh network glitch, preserving credentials:', err)
        setIsLoading(false)
        return
      }
    }

    // Only clear if refresh token was explicitly rejected
    clearCitizenToken()
    clear()
    setIsLoading(false)
  }

  useEffect(() => {
    checkSession()
  }, [])

  const logout = () => {
    clearCitizenToken()
    clear()
    router.push('/login')
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    checkSession,
    logout,
  }
}
