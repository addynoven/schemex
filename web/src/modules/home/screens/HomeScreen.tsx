'use client'

import { useState } from 'react'
import { Brain } from 'lucide-react'
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
import { NbButton } from '@/core/design-system/Neubrutalist'

export function HomeScreen({ initialSessionId }: { initialSessionId?: number | string } = {}) {
  const {
    currentSessionId,
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

        {/* Sub-navigation Context Bar (Neubrutal Window Header) */}
        <div className="h-11 px-4 sm:px-6 flex items-center justify-between border-b-2 border-black dark:border-emerald-500/80 bg-[#FFFDF9] dark:bg-[#131F18] text-xs shrink-0 transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-black text-black dark:text-white">:: Welfare Advisor</span>
            <span className="text-black dark:text-emerald-500">·</span>
            <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold">4,160+ Schemes Indexed</span>
          </div>

          <div className="flex items-center gap-2">
            <NbButton
              type="button"
              onClick={() => openMemoryInspector(null)}
              nbVariant="secondary"
              size="sm"
              className="h-7 px-2.5 text-xs flex items-center gap-1.5"
              title="Inspect conversation context"
            >
              <Brain className="h-3.5 w-3.5 text-black dark:text-emerald-400" />
              <span className="hidden sm:inline">Context Trace</span>
            </NbButton>
          </div>
        </div>

        {/* Chat Timeline / Welcome */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-none bg-transparent">
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
        <footer className="p-4 border-t-2 border-black dark:border-emerald-500/80 bg-[#FFFDF9] dark:bg-[#131F18] shrink-0 transition-colors">
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
