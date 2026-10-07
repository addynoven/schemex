'use client'

import { Bot, Sparkles, BookOpen, AlertTriangle, Terminal, Brain, Mic, CheckCircle2, Copy } from 'lucide-react'
import { MarkdownMessage } from './MarkdownMessage'
import { type ChatMessage } from '@/core'
import { useDevErrorStore } from '@/core/errors/devErrorStore'

interface ChatMessageListProps {
  messages: ChatMessage[]
  streamBuffer: string
  streamCitations: string[]
  isStreaming: boolean
}

export function ChatMessageList({
  messages,
  streamBuffer,
  streamCitations,
  isStreaming,
}: ChatMessageListProps) {
  const { openDevError } = useDevErrorStore()

  return (
    <div className="flex flex-col gap-4 font-sans max-w-full overflow-hidden">
      {messages.map((m, idx) => {
        const isUser = (m.role || (m as any).sender) === 'user'

        const isError =
          !isUser &&
          (m.status === 'rate_limit_exceeded' ||
            m.status === 'service_unavailable' ||
            m.status === 'error' ||
            Boolean(m.error_code) ||
            m.content.includes('[Dev Mode:') ||
            m.content.includes('trouble connecting'))

        const isRateLimit =
          !isUser &&
          (m.status === 'rate_limit_exceeded' ||
            m.error_code === 'AI_RATE_LIMIT_EXCEEDED' ||
            m.content.includes('Rate Limit') ||
            m.content.includes('429'))

        if (isUser) {
          return (
            <div key={m.id || idx} className="flex flex-col items-end gap-1 max-w-xl self-end min-w-0">
              <div className="bg-[#A4F1B2] text-[#131B2E] px-4 py-3 rounded-2xl rounded-br-none shadow-xs border border-[#1F6C3A]/20 break-words max-w-full min-w-0">
                <p className="font-medium text-sm leading-relaxed whitespace-pre-wrap break-words">
                  "{m.content}"
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-1 text-slate-500 min-w-0">
                <Mic className="h-3 w-3 text-[#1F6C3A] shrink-0" />
                <span className="font-mono text-[10px] font-bold uppercase truncate">
                  {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Citizen Query
                </span>
              </div>
            </div>
          )
        }

        return (
          <div key={m.id || idx} className="flex flex-col items-start gap-2 max-w-2xl self-start w-full min-w-0">
            <div className={`p-4 sm:p-5 rounded-2xl rounded-bl-none shadow-sm border w-full flex flex-col gap-3 min-w-0 overflow-hidden ${
              isError ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200/80 text-slate-900'
            }`}>

              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isError ? 'bg-rose-600 text-white' : 'bg-[#0E6245] text-white'
                  }`}>
                    {isError ? <AlertTriangle className="h-3.5 w-3.5" /> : 'AI'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                    {isError ? 'System Alert' : 'Verified Welfare Advisor'}
                  </span>
                </div>

                {m.memory_trace && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E2E7FF] text-[#0E6245] font-bold text-[10px] flex items-center gap-1 shrink-0">
                    <Brain className="h-3 w-3" />
                    {m.memory_trace.semantic_memory?.recalled_facts_count || 3} Contexts
                  </span>
                )}
              </div>

              <div className="min-w-0 max-w-full overflow-hidden">
                <MarkdownMessage content={m.content} />
              </div>

              {(isError || m.stack_trace || m.error_code) && (
                <div className="pt-3 mt-1 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700 font-mono font-bold">
                    {isRateLimit ? 'HTTP 429 · AI Quota Exceeded' : 'Service Issue Detected'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      openDevError({
                        title: isRateLimit ? 'Upstream AI Rate Limit Exceeded (HTTP 429)' : 'Welfare AI Service Error',
                        errorCode: m.error_code || (isRateLimit ? 'AI_RATE_LIMIT_EXCEEDED' : 'SERVICE_UNAVAILABLE'),
                        httpStatus: isRateLimit ? 429 : 503,
                        origin: 'Backend API',
                        endpoint: '/chat/sessions/messages',
                        message: m.content,
                        stackTrace: m.stack_trace || null,
                        solution: isRateLimit
                          ? 'Set LLM_PROVIDER=agy in backend/.env to use local CLI without external Gemini API rate limits.'
                          : 'Check backend server terminal logs for traceback.',
                        timestamp: m.created_at || new Date().toISOString(),
                      })
                    }
                    className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Terminal className="h-3 w-3 text-rose-600" />
                    <span>Inspect Stack & Diagnostics</span>
                  </button>
                </div>
              )}

              {m.citations && m.citations.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <BookOpen className="h-3 w-3 text-[#0E6245] shrink-0" />
                  <span className="font-bold uppercase shrink-0">Sources:</span>
                  {m.citations.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-[10px] text-slate-700 border border-slate-200 truncate max-w-[200px]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Timestamp for Assistant */}
            <div className="flex items-center justify-between w-full px-1 min-w-0">
              <span className="font-mono text-[10px] text-slate-500 font-bold uppercase truncate">
                {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Assessed against National Directory
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button className="text-slate-400 hover:text-[#0E6245] transition-colors cursor-pointer" title="Copy response">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {isStreaming && (
        <div className="flex flex-col items-start gap-2 max-w-2xl self-start w-full min-w-0 animate-in fade-in duration-300">
          <div className="p-4 sm:p-5 rounded-2xl rounded-bl-none shadow-sm border bg-white border-slate-200/80 text-slate-900 w-full flex flex-col gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold bg-[#0E6245] text-white shrink-0">
                  AI
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Sparkles className="h-3 w-3 text-amber-500 animate-pulse shrink-0" />
                  Generating Response...
                </span>
              </div>
            </div>

            {streamBuffer ? (
              <div className="min-w-0 max-w-full overflow-hidden">
                <MarkdownMessage content={streamBuffer} />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
                <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
