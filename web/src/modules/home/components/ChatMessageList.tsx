'use client'

import { Sparkles, BookOpen, AlertTriangle, Terminal, Brain, Mic, Copy } from 'lucide-react'
import { MarkdownMessage } from './MarkdownMessage'
import { type ChatMessage } from '@/core'
import { useDevErrorStore } from '@/core/errors/devErrorStore'
import { NbCard, NbBadge } from '@/core/design-system/Neubrutalist'

interface ChatMessageListProps {
  messages: ChatMessage[]
  streamBuffer: string
  streamCitations: string[]
  isStreaming: boolean
}

export function ChatMessageList({
  messages,
  streamBuffer,
  streamCitations: _streamCitations,
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
            <div key={m.id || idx} className="flex flex-col items-end gap-1.5 max-w-xl self-end min-w-0">
              <div className="bg-emerald-400 dark:bg-emerald-500 text-black px-4 py-3 rounded-2xl border-2 border-black dark:border-black shadow-[3px_3px_0px_0px_#000000] break-words max-w-full min-w-0">
                <p className="font-bold text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {m.content}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-1 text-black dark:text-emerald-400 min-w-0">
                <Mic className="h-3 w-3 text-black dark:text-emerald-400 shrink-0" />
                <span className="font-mono text-[10px] font-black uppercase truncate">
                  {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Citizen Query
                </span>
              </div>
            </div>
          )
        }

        return (
          <div key={m.id || idx} className="flex flex-col items-start gap-2 max-w-2xl self-start w-full min-w-0">
            <NbCard className={`p-4 sm:p-5 w-full flex flex-col gap-3 min-w-0 overflow-hidden ${
              isError
                ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-900 text-black dark:text-rose-100'
                : ''
            }`}>

              <div className="flex items-center justify-between gap-2 border-b-2 border-black dark:border-emerald-500/80 pb-2.5 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-6 px-2 rounded-md border-2 border-black font-black text-xs flex items-center justify-center shrink-0 ${
                    isError ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-black'
                  }`}>
                    {isError ? <AlertTriangle className="h-3.5 w-3.5" /> : 'AI'}
                  </span>
                  <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider truncate">
                    {isError ? ':: System Alert' : ':: Scheme Advisor'}
                  </span>
                </div>

                {m.memory_trace && (
                  <span className="text-[11px] font-mono text-black dark:text-emerald-300 font-bold flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-md border border-black dark:border-emerald-500 bg-[#F4EFEA] dark:bg-[#0B120E]">
                    <Brain className="h-3 w-3 text-black dark:text-emerald-400" />
                    <span>{m.memory_trace.semantic_memory?.recalled_facts_count || 3} facts</span>
                  </span>
                )}
              </div>

              <div className="min-w-0 max-w-full overflow-hidden text-slate-900 dark:text-slate-100 font-medium">
                <MarkdownMessage content={m.content} />
              </div>

              {(isError || m.stack_trace || m.error_code) && (
                <div className="pt-3 mt-1 border-t-2 border-black dark:border-emerald-500/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700 dark:text-rose-300 font-mono font-black">
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
                    className="px-2.5 py-1.5 bg-rose-200 dark:bg-rose-900 hover:bg-rose-300 text-black dark:text-white border-2 border-black rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-[2px_2px_0px_0px_#000000]"
                  >
                    <Terminal className="h-3 w-3 text-black dark:text-white" />
                    <span>Inspect Stack</span>
                  </button>
                </div>
              )}

              {m.citations && m.citations.length > 0 && (
                <div className="pt-2 border-t-2 border-black dark:border-emerald-500/80 flex flex-wrap items-center gap-1.5 text-[11px] text-black dark:text-slate-300">
                  <BookOpen className="h-3.5 w-3.5 text-black dark:text-emerald-400 shrink-0" />
                  <span className="font-black uppercase shrink-0">Sources:</span>
                  {m.citations.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[#F4EFEA] dark:bg-[#0B120E] rounded-md font-mono text-[10px] text-black dark:text-emerald-300 font-bold border border-black dark:border-emerald-500 truncate max-w-[200px]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </NbCard>

            {/* Timestamp for Assistant */}
            <div className="flex items-center justify-between w-full px-1 min-w-0">
              <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase truncate">
                {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Verified National Directory
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button className="text-black dark:text-emerald-400 hover:scale-110 transition-transform cursor-pointer" title="Copy response">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {isStreaming && (
        <div className="flex flex-col items-start gap-2 max-w-2xl self-start w-full min-w-0 animate-in fade-in duration-300">
          <NbCard className="w-full flex flex-col gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-black dark:border-emerald-500/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="h-6 px-2 rounded-md border-2 border-black bg-emerald-400 text-black font-black text-xs flex items-center justify-center shrink-0">
                  AI
                </span>
                <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin shrink-0" />
                  :: Evaluating Eligibility...
                </span>
              </div>
            </div>

            {streamBuffer ? (
              <div className="min-w-0 max-w-full overflow-hidden text-slate-900 dark:text-slate-100 font-medium">
                <MarkdownMessage content={streamBuffer} />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs py-2">
                <div className="h-2 w-2 bg-black dark:bg-emerald-400 rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-black dark:bg-emerald-400 rounded-full animate-bounce delay-100" />
                <div className="h-2 w-2 bg-black dark:bg-emerald-400 rounded-full animate-bounce delay-200" />
              </div>
            )}
          </NbCard>
        </div>
      )}
    </div>
  )
}
