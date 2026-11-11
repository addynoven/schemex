'use client'

import React, { useRef, useEffect } from 'react'
import {
  Send,
  Loader2,
  Mic,
  MicOff,
  Plus,
  AlertTriangle,
  RotateCcw,
  Terminal,
} from 'lucide-react'
import { useDevErrorStore } from '@/core/errors/devErrorStore'
import { NbButton } from '@/core/design-system/Neubrutalist'

interface ChatComposerProps {
  input: string
  setInput: (val: string | ((prev: string) => string)) => void
  onSend: (text?: string) => void
  isStreaming: boolean
  isDictating?: boolean
  isServiceBlocked?: boolean
  serviceErrorMessage?: string | null
  onResetServiceBlock?: () => void
  onToggleDictation?: () => void
  placeholder?: string
  citizenState?: string
  autoFocus?: boolean
  className?: string
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  input,
  setInput,
  onSend,
  isStreaming,
  isDictating = false,
  isServiceBlocked = false,
  serviceErrorMessage,
  onResetServiceBlock,
  onToggleDictation,
  placeholder = 'Ask about scholarships, housing, healthcare, pensions...',
  citizenState = 'India',
  autoFocus = false,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { openDevError } = useDevErrorStore()

  // Native Browser Web Speech API (Client-side STT)
  const [isSpeechSupported, setIsSpeechSupported] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSpeechSupported(true)
        try {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'hi-IN'

          recognition.onresult = (event: any) => {
            let transcript = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript
            }
            if (transcript.trim()) {
              setInput(transcript.trim())
            }
          }

          recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error)
            setIsListening(false)
          }

          recognition.onend = () => {
            setIsListening(false)
          }

          recognitionRef.current = recognition
        } catch (err) {
          console.warn('Speech recognition initialization failed:', err)
          setIsSpeechSupported(false)
        }
      }
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [setInput])

  const handleToggleDictation = () => {
    if (onToggleDictation) {
      onToggleDictation()
      return
    }
    if (!recognitionRef.current) return
    if (isListening) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.warn('Could not start speech recognition:', err)
      }
    }
  }

  const activeDictating = isDictating || isListening

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSendAction = () => {
    if (isServiceBlocked && onResetServiceBlock) {
      onResetServiceBlock()
    }
    onSend()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isStreaming) {
        handleSendAction()
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isServiceBlocked && onResetServiceBlock) {
      onResetServiceBlock()
    }
    setInput(e.target.value)
  }

  const hasContent = Boolean(input && input.trim().length > 0)
  const canSend = hasContent && !isStreaming

  return (
    <div className={`w-full ${className} font-sans`}>
      {/* Service Block / Rate Limit Alert Banner */}
      {isServiceBlocked && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-semibold text-rose-900">
              {serviceErrorMessage || 'AI Service temporarily unavailable'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                openDevError({
                  title: 'AI Service Rate Limit (HTTP 429)',
                  errorCode: 'AI_RATE_LIMIT_EXCEEDED',
                  httpStatus: 429,
                  origin: 'Backend API',
                  endpoint: '/chat/sessions/messages',
                  message: serviceErrorMessage || 'Upstream LLM Provider quota exhausted.',
                  solution: 'Set LLM_PROVIDER=agy in backend/.env to use local CLI without external rate limits.',
                  timestamp: new Date().toISOString(),
                })
              }
              className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-1 border border-rose-300 transition-colors cursor-pointer"
            >
              <Terminal className="h-3 w-3" />
              <span>Diagnostics</span>
            </button>
            {onResetServiceBlock && (
              <button
                type="button"
                onClick={onResetServiceBlock}
                className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset lock and try sending again"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Neubrutalist Input Composer */}
      <div
        className={`relative rounded-2xl bg-[#FFFDF9] dark:bg-[#131F18] border-2 border-black dark:border-emerald-500 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#059669] transition-all px-3 py-2 flex items-center gap-2`}
      >
        {/* Attach Button (Left) */}
        <button
          type="button"
          onClick={() => {
            window.location.href = '/vault'
          }}
          className="h-9 w-9 rounded-xl border-2 border-black dark:border-emerald-500 bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-emerald-400 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center shrink-0 transition-all cursor-pointer"
          title="Attach document or open vault"
        >
          <Plus className="h-4 w-4 text-black dark:text-emerald-400" />
        </button>

        {/* Main Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className="flex-1 bg-transparent border-0 resize-none py-2 px-2 text-sm text-black dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 font-bold focus:outline-none max-h-40 leading-relaxed disabled:opacity-50"
        />

        {/* Right Actions: Mic & Send */}
        <div className="flex items-center gap-2 shrink-0">
          {(isSpeechSupported || onToggleDictation) && (
            <button
              type="button"
              onClick={handleToggleDictation}
              className={`h-9 w-9 rounded-xl border-2 border-black dark:border-emerald-500 flex items-center justify-center transition-all cursor-pointer ${
                activeDictating
                  ? 'bg-rose-400 text-black shadow-[2px_2px_0px_0px_#000000] animate-pulse'
                  : 'bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-emerald-400 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#059669] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
              title={activeDictating ? 'Stop listening' : 'Speak to input text'}
            >
              {activeDictating ? <MicOff className="h-4 w-4 text-black" /> : <Mic className="h-4 w-4 text-black dark:text-emerald-400" />}
            </button>
          )}

          <NbButton
            type="button"
            onClick={handleSendAction}
            disabled={!canSend}
            nbVariant="primary"
            size="sm"
            className="h-9 px-3.5"
            title={canSend ? 'Send message' : 'Type a message to send'}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              <>
                <span className="hidden sm:inline text-xs font-black">Send</span>
                <Send className="h-3.5 w-3.5 text-black" />
              </>
            )}
          </NbButton>
        </div>
      </div>

      {/* Helpful Hint Subtitle */}
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-300 mt-2.5 px-1">
        <span>Press <strong className="text-black dark:text-white font-black underline decoration-emerald-500 decoration-2">Enter</strong> to send · <strong className="text-black dark:text-white font-black">Shift+Enter</strong> for newline</span>
        <span className="font-mono text-[10px] text-black dark:text-emerald-400">
          :: Deterministic Engine
        </span>
      </div>
    </div>
  )
}
