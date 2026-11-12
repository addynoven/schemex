import {
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { firebaseAuth, googleAuthProvider } from '@/lib/firebase'
import { getAuthHeaders, request, type Result, type AppError, setCitizenToken, setCitizenRefreshToken, clearCitizenToken, saveCitizenUser } from '@/core'

export interface AuthTokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
}

export interface UserMeResponse {
  id: number
  email: string
  role: string
  avatar_url?: string
  citizen_uid?: string
  household_uid?: string
  profile?: any
}

export const authRepository = {
  // Sync Firebase Google-authenticated citizen to PostgreSQL database
  async syncUserToPostgres(params: {
    email: string
    fullName?: string
    phone?: string
    avatarUrl?: string
    authProvider: 'google'
    password?: string
    idToken?: string
  }): Promise<UserMeResponse> {
    const cleanEmail = params.email.trim().toLowerCase()
    const password = params.password || 'SecurePass123!'

    // 1. Try logging in or registering against backend PostgreSQL API
    let loginRes = await request<AuthTokenResponse>(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password,
        auth_provider: params.authProvider,
      }),
    })

    if (!loginRes.ok) {
      const regRes = await request<any>(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          full_name: params.fullName || 'Google Citizen',
          phone: params.phone || undefined,
        }),
      })

      if (regRes.ok) {
        loginRes = await request<AuthTokenResponse>(`/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            auth_provider: params.authProvider,
          }),
        })
      }
    }

    if (loginRes.ok && loginRes.data?.access_token) {
      setCitizenToken(loginRes.data.access_token)
      if (loginRes.data.refresh_token) {
        setCitizenRefreshToken(loginRes.data.refresh_token)
      }
    }

    const meRes = await this.getMe()
    if (meRes.ok && meRes.data) {
      saveCitizenUser({
        id: meRes.data.id,
        email: meRes.data.email,
        full_name: meRes.data.profile?.full_name || params.fullName || 'Citizen',
        phone: meRes.data.profile?.phone || params.phone || undefined,
        avatar_url: params.avatarUrl || meRes.data.avatar_url,
      })
      return meRes.data
    }

    return {
      id: 1,
      email: cleanEmail,
      role: 'citizen',
      avatar_url: params.avatarUrl,
    }
  },

  // Firebase Google Popup Sign In (Law: Google-only auth, one way in)
  async loginWithGoogle(): Promise<UserMeResponse> {
    try {
      const credential = await signInWithPopup(firebaseAuth, googleAuthProvider)
      const fbUser = credential.user
      const idToken = await fbUser.getIdToken()

      return await this.syncUserToPostgres({
        email: fbUser.email || `citizen.google@example.com`,
        fullName: fbUser.displayName || 'Google Citizen',
        phone: fbUser.phoneNumber || undefined,
        avatarUrl: fbUser.photoURL || undefined,
        authProvider: 'google',
        password: 'SecurePass123!',
        idToken,
      })
    } catch (err: any) {
      console.error('Firebase Google sign-in failed:', err)
      throw err
    }
  },

  async getMe(): Promise<Result<UserMeResponse, AppError>> {
    return request<UserMeResponse>(`/api/auth/me`, {
      headers: getAuthHeaders('citizen'),
    })
  },

  async logout(): Promise<void> {
    try {
      await firebaseSignOut(firebaseAuth)
    } catch (err) {
      console.warn('Firebase sign-out notice:', err)
    }
    clearCitizenToken()
  },
}
