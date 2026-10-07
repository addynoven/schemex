'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { homeRepository } from '../repositories'
import { useChatStore } from '../store'
import { type ChatMessage, type ChatSession } from '@/core'
import { captureDevError } from '@/core/errors/devErrorStore'

export function useChat(initialSessionIdentifier?: number | string) {
  const {
    currentSessionId,
    sessions,
    messages,
    streamBuffer,
    streamCitations,
    isStreaming,
    isServiceBlocked,
    serviceErrorMessage,
    setCurrentSessionId,
    setSessions,
    setMessages,
    setStreamBuffer,
    setStreamCitations,
    setIsStreaming,
    setIsServiceBlocked,
    resetServiceBlock,
  } = useChatStore()

  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('Citizen')

  const loadSessions = useCallback(async () => {
    try {
      const data = await homeRepository.listSessions()
      setSessions(data || [])
    } catch {}
  }, [setSessions])

  const loadUser = useCallback(async () => {
    try {
      const user = await homeRepository.getMe()
      if (user?.profile?.full_name) setUserName(user.profile.full_name)
    } catch {}
  }, [])

  const router = useRouter()

  const selectSession = useCallback(async (sessionKey: number | string) => {
    setLoading(true)
    setCurrentSessionId(sessionKey)
    if (sessionKey && sessionKey !== '0' && sessionKey !== 0) {
      if (typeof window !== 'undefined' && window.location.pathname !== `/c/${sessionKey}`) {
        router.push(`/c/${sessionKey}`)
      }
    } else {
      setMessages([])
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        router.push('/')
      }
    }
    try {
      if (sessionKey && sessionKey !== '0' && sessionKey !== 0) {
        const session = await homeRepository.getSession(sessionKey)
        setMessages(session.messages || [])
        if (session.session_uid && sessionKey !== session.session_uid) {
          router.push(`/c/${session.session_uid}`)
        }
      }
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [setCurrentSessionId, setMessages, router])

  useEffect(() => {
    loadSessions()
    loadUser()
    if (initialSessionIdentifier) {
      selectSession(initialSessionIdentifier)
    }
  }, [loadSessions, loadUser, initialSessionIdentifier, selectSession])


  const ensureSession = useCallback(async () => {
    if (currentSessionId && currentSessionId !== '0' && currentSessionId !== 0) {
      return currentSessionId
    }
    const newSession = await homeRepository.createSession('New Welfare Consultation')
    const key = newSession.session_uid || newSession.id
    setCurrentSessionId(key)
    setSessions([newSession, ...sessions])
    if (typeof window !== 'undefined' && window.location.pathname !== `/c/${key}`) {
      router.push(`/c/${key}`)
    }
    return key
  }, [currentSessionId, sessions, setCurrentSessionId, setSessions, router])

  const sendQuery = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return
    if (isServiceBlocked) resetServiceBlock()

    console.log('💬 [useChat] User query initiated:', text)
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsStreaming(true)
    setStreamBuffer('')
    setStreamCitations([])

    let accumulatedText = ''
    let accumulatedCitations: string[] = []

    try {
      const sessionId = await ensureSession()
      console.log('🎯 [useChat] Active session ID:', sessionId)

      await homeRepository.streamMessage(
        sessionId,
        text,
        (token: string, citations?: string[]) => {
          accumulatedText += token
          setStreamBuffer(accumulatedText)
          if (citations && citations.length > 0) {
            accumulatedCitations = Array.from(new Set([...accumulatedCitations, ...citations]))
            setStreamCitations(accumulatedCitations)
          }
        },
        async (messageId: number, memoryTrace?: any) => {
          console.log('✅ [useChat] Stream finalized for message ID:', messageId, '| Total text length:', accumulatedText.length)
          setIsStreaming(false)
          if (accumulatedText.trim().length > 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: messageId || Date.now() + 1,
                role: 'assistant',
                content: accumulatedText,
                citations: accumulatedCitations,
                memory_trace: memoryTrace,
                created_at: new Date().toISOString(),
              },
            ])
          }
          setStreamBuffer('')
          setStreamCitations([])
          await loadSessions()
        },
        async (err: any) => {
          console.warn('⚠️ [useChat] Stream reported error:', err.message)
          const isRateLimit =
            err.message?.includes('429') ||
            err.status === 429 ||
            accumulatedText.includes('429') ||
            accumulatedText.includes('Rate Limit')

          setIsServiceBlocked(
            true,
            isRateLimit
              ? 'AI Rate Limit Reached (HTTP 429) — AI queries temporarily locked'
              : 'Welfare AI Service Temporarily Unavailable'
          )

          captureDevError({
            title: isRateLimit ? 'Upstream AI Rate Limit Exceeded (HTTP 429)' : 'Welfare AI Service Error',
            errorCode: isRateLimit ? 'AI_RATE_LIMIT_EXCEEDED' : 'SERVICE_UNAVAILABLE',
            httpStatus: isRateLimit ? 429 : 503,
            origin: 'SSE Stream',
            endpoint: `/chat/sessions/${sessionId}/messages/stream`,
            message: accumulatedText || err.message || 'Stream connection failed',
            solution: isRateLimit
              ? 'Set LLM_PROVIDER=agy in backend/.env to use local CLI without external Gemini API rate limits.'
              : 'Check backend server logs.',
          })

          if (accumulatedText.trim().length > 0) {
            // We already received error text via token chunk
            setIsStreaming(false)
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 1,
                role: 'assistant',
                status: isRateLimit ? 'rate_limit_exceeded' : 'service_unavailable',
                error_code: isRateLimit ? 'AI_RATE_LIMIT_EXCEEDED' : 'SERVICE_UNAVAILABLE',
                content: accumulatedText,
                citations: [],
                created_at: new Date().toISOString(),
              },
            ])
            setStreamBuffer('')
            setStreamCitations([])
          } else {
            console.log('🔄 [useChat] Attempting REST fallback sendMessage...')
            try {
              const resp = await homeRepository.sendMessage(sessionId, text)
              console.log('✅ [useChat] Fallback REST message succeeded:', resp)
              setMessages((prev) => [...prev, resp])
            } catch (fallbackErr: any) {
              console.error('❌ [useChat] Fallback REST message failed:', fallbackErr)
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + 1,
                  role: 'assistant',
                  status: isRateLimit ? 'rate_limit_exceeded' : 'service_unavailable',
                  error_code: isRateLimit ? 'AI_RATE_LIMIT_EXCEEDED' : 'SERVICE_UNAVAILABLE',
                  content: "Sorry, we are facing technical issues reaching the welfare consultation service right now. Please try again in a moment.",
                  citations: [],
                  created_at: new Date().toISOString(),
                },
              ])
            } finally {
              setIsStreaming(false)
              setStreamBuffer('')
              setStreamCitations([])
            }
          }
        }
      )
    } catch (e: any) {
      console.error('❌ [useChat] Unexpected error in sendQuery:', e)
      setIsServiceBlocked(true, 'Unexpected client error in chat pipeline')
      captureDevError({
        title: 'Chat Pipeline Unexpected Client Error',
        errorCode: 'CLIENT_CHAT_EXCEPTION',
        origin: 'Frontend Client',
        message: e.message || String(e),
      })
      setIsStreaming(false)
    }
  }, [isStreaming, ensureSession, setMessages, setIsStreaming, setStreamBuffer, setStreamCitations, loadSessions, setIsServiceBlocked])

  return {
    currentSessionId,
    sessions,
    messages,
    streamBuffer,
    streamCitations,
    isStreaming,
    isServiceBlocked,
    serviceErrorMessage,
    userName,
    loading,
    selectSession,
    sendQuery,
    reloadSessions: loadSessions,
    resetServiceBlock,
  }
}
