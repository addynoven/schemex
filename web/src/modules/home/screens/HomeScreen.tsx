'use client'

import { useState } from 'react'
import { Brain, Sparkles, Languages, Share2 } from 'lucide-react'
import {
  ChatWelcomeHero,
  ChatMessageList,
  ChatComposer,
} from '../components'
import { useChat } from '../hooks'
import { useChatStore } from '../store'
import { useAuth } from '@/modules/auth'
import { DevErrorModal } from '@/core/components/DevErrorModal'
import { MemoryEnginePanel } from '@/components/MemoryEnginePanel'
import { AppLayout } from '@/components/layout/AppLayout'

export function HomeScreen({ initialSessionId }: { initialSessionId?: number | string } = {}) {
  const {
    currentSessionId,
    sessions,
    messages,
    streamBuffer,
    streamCitations,
    isStreaming,
    isServiceBlocked,
    serviceErrorMessage,
    userName,
    selectSession,
    sendQuery,
    resetServiceBlock,
  } = useChat(initialSessionId)

  const { user } = useAuth()
  const {
    isMemoryInspectorOpen,
    activeMemoryTrace,
    activePromptSnippet,
    openMemoryInspector,
    closeMemoryInspector,
  } = useChatStore()
  const [input, setInput] = useState('')

  function handleSend(text?: string) {
    const query = text || input
    if (query.trim()) {
      sendQuery(query)
      setInput('')
    }
  }

  return (
    <AppLayout
      currentSessionId={currentSessionId}
      onSelectSession={(id) => selectSession(id)}
      onNewSession={() => selectSession(0)}
    >
      <div className="flex flex-col h-full overflow-hidden bg-transparent font-sans">

        {/* Chat-specific Header Bar (replaces the old full-screen header) */}
        <div className="bg-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0E6245] flex items-center justify-center text-white shrink-0">
              <Brain className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-slate-900">AI Scheme Advisor</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#A4F1B2] text-[#24703E] text-[11px] font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1F6C3A] animate-pulse" />
                  Live Assistant
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-bold">Multilingual Civic Synthesis • Sovereign Gov-Cloud Node</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle Mock */}
            <div className="bg-[#F2F3FF] p-1 rounded-xl flex items-center gap-1 border border-[#E2E7FF]">
              <Languages className="h-3 w-3 text-slate-500 ml-1" />
              <button className="px-2.5 py-1 rounded-lg bg-white shadow-xs text-slate-900 font-bold text-[11px] cursor-pointer">
                English
              </button>
              <button className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 font-bold text-[11px] cursor-pointer">
                हिंदी
              </button>
              <button className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 font-bold text-[11px] cursor-pointer">
                ಕನ್ನಡ
              </button>
            </div>

            <button
              onClick={() => openMemoryInspector(null)}
              className="bg-[#F2F3FF] hover:bg-[#E2E7FF] text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-[#E2E7FF]"
            >
              <Brain className="h-3.5 w-3.5 text-[#0E6245]" />
              <span className="hidden sm:inline">Memory</span>
            </button>

            <button className="bg-[#F2F3FF] hover:bg-[#E2E7FF] text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-[#E2E7FF]">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Chat Timeline / Welcome */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-none bg-slate-50/50">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && !streamBuffer ? (
              <ChatWelcomeHero userName={userName} onSelectSuggestion={sendQuery} />
            ) : (
              <ChatMessageList
                messages={messages}
                streamBuffer={streamBuffer}
                streamCitations={streamCitations}
                isStreaming={isStreaming}
              />
            )}
          </div>
        </div>

        {/* Bottom Composer */}
        <footer className="p-4 border-t border-slate-200 bg-white shrink-0">
          <div className="max-w-4xl mx-auto">
            <ChatComposer
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isStreaming={isStreaming}
              isServiceBlocked={isServiceBlocked}
              serviceErrorMessage={serviceErrorMessage}
              onResetServiceBlock={resetServiceBlock}
            />
          </div>
        </footer>

        {/* Memory Engine Inspector Drawer */}
        <MemoryEnginePanel
          isOpen={isMemoryInspectorOpen}
          onClose={closeMemoryInspector}
          memoryTrace={
            activeMemoryTrace ||
            [...messages].reverse().find((m) => m.memory_trace)?.memory_trace || {
              working_memory: {
                model_name: 'gemini-3.8-flash',
                provider: 'gemini',
                system_instruction_summary: 'Sovereign Citizen Welfare AI Advisor (India)...',
                prompt_tokens: 380,
                completion_tokens: 140,
                total_tokens: 520,
              },
              semantic_memory: {
                recalled_facts_count: user?.profile ? 4 : 2,
                recalled_facts: user?.profile
                  ? [
                      { key: 'full_name', value: user.profile.full_name || userName || 'Citizen', status: 'IN_PROMPT' },
                      { key: 'state', value: user.profile.state || 'Maharashtra', status: 'IN_PROMPT' },
                      { key: 'annual_income', value: `₹${(user.profile.annual_income || 120000).toLocaleString()}`, status: 'IN_PROMPT' },
                      { key: 'occupation', value: user.profile.occupation || 'farmer', status: 'IN_PROMPT' },
                    ]
                  : [
                      { key: 'state', value: 'Maharashtra', status: 'IN_PROMPT' },
                      { key: 'occupation', value: 'farmer', status: 'IN_PROMPT' },
                    ],
              },
              episodic_memory: {
                session_turns_count: messages.length,
                history_events: messages.slice(-4).map((m) => ({
                  sender: m.role,
                  snippet: m.content.slice(0, 80),
                  timestamp: m.created_at || new Date().toISOString(),
                })),
              },
              procedural_memory: {
                available_tools_count: 4,
                tools_executed_count: 1,
                tools_executed: [
                  {
                    name: 'check_eligibility',
                    args: { state: user?.profile?.state || 'Maharashtra', occupation: 'farmer', annual_income: 120000 },
                    duration_ms: 85,
                    status: 'success',
                    matched_count: 4,
                  },
                ],
              },
            }
          }
          activeMessageSnippet={activePromptSnippet || undefined}
        />

        {/* Centralized Dev Mode Error Inspector Modal */}
        <DevErrorModal />
      </div>
    </AppLayout>
  )
}
