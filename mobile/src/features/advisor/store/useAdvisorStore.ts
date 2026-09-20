import { create } from 'zustand';
import type {
  BackendChatMessageResponse,
  BackendChatSessionResponse,
  ChatMessage,
  PromptChip,
  SchemeRecommendation,
  ThinkingStep,
} from '../models/advisor.model';
import { advisorRepository } from '../repositories/advisor.repository';
import { chatSyncService } from '../services/chat-sync.service';

export const INITIAL_THINKING_STEPS: readonly ThinkingStep[] = [
  { id: '1', title: 'Understanding your query', status: 'pending' },
  { id: '2', title: 'Finding relevant schemes', status: 'pending' },
  { id: '3', title: 'Checking eligibility criteria', status: 'pending' },
  { id: '4', title: 'Preparing recommendations', status: 'pending' },
];


interface AdvisorState {
  readonly messages: readonly ChatMessage[];
  readonly inputText: string;
  readonly isThinking: boolean;
  readonly thinkingSteps: readonly ThinkingStep[];
  readonly isListening: boolean;
  readonly promptChips: readonly PromptChip[];
  readonly sessions: readonly BackendChatSessionResponse[];
  readonly currentSessionId: string | null;
  readonly isHistoryOpen: boolean;
  readonly errorMessage: string | null;
  readonly lastFailedQuery: string | null;

  readonly setInputText: (text: string) => void;
  readonly startVoiceInput: () => void;
  readonly stopVoiceInput: (simulatedText?: string) => void;
  readonly sendMessage: (overrideQuery?: string) => Promise<void>;
  readonly retryLastQuery: () => Promise<void>;
  readonly clearError: () => void;
  readonly resetConversation: () => void;
  readonly loadPromptChips: () => Promise<void>;
  readonly loadSessions: () => Promise<void>;
  readonly selectSession: (sessionId: string) => Promise<void>;
  readonly createNewSession: (title?: string) => Promise<string | null>;
  readonly deleteSession: (sessionId: string) => Promise<void>;
  readonly openHistory: () => void;
  readonly closeHistory: () => void;
}

function mapBackendMessageToChatMessage(bm: BackendChatMessageResponse): ChatMessage {
  const recommendations: SchemeRecommendation[] = (bm.sources || []).map((s) => ({
    id: s.slug,
    title: s.title,
    ministry: 'Government of India',
    benefitAmount: '',
    benefitDescription: 'Verified citizen welfare scheme',
    tags: ['Verified', 'Government Scheme'],
  }));

  const sources =
    bm.citations && bm.citations.length > 0
      ? bm.citations
      : (bm.sources || []).map((s) => s.title);

  return {
    id: `msg_${bm.id}`,
    sender: bm.sender === 'user' ? 'user' : 'assistant',
    text: bm.content,
    timestamp: new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date(bm.created_at || Date.now())),
    recommendations: recommendations.length > 0 ? recommendations : undefined,
    sources: sources.length > 0 ? sources : undefined,
  };
}

export const useAdvisorStore = create<AdvisorState>((set, get) => ({
  messages: [],
  inputText: '',
  isThinking: false,
  thinkingSteps: INITIAL_THINKING_STEPS,
  isListening: false,
  promptChips: [],
  sessions: [],
  currentSessionId: null,
  isHistoryOpen: false,
  errorMessage: null,
  lastFailedQuery: null,

  setInputText: (text: string) => set({ inputText: text }),

  startVoiceInput: () => set({ isListening: true }),

  stopVoiceInput: (simulatedText?: string) => {
    set({ isListening: false });
    if (simulatedText) {
      void get().sendMessage(simulatedText);
    }
  },

  clearError: () => set({ errorMessage: null }),

  openHistory: () => {
    set({ isHistoryOpen: true });
    void get().loadSessions();
  },

  closeHistory: () => set({ isHistoryOpen: false }),

  loadPromptChips: async () => {
    const result = await advisorRepository.getPromptChips();
    if (result.ok) {
      set({ promptChips: result.data });
    }
  },

  loadSessions: async () => {
    const result = await advisorRepository.listSessions();
    if (result.ok && result.data) {
      set({ sessions: result.data });
    }
  },

  selectSession: async (sessionId: string) => {
    set({ currentSessionId: sessionId, isThinking: true, errorMessage: null });
    const result = await advisorRepository.getSession(sessionId);
    if (result.ok && result.data) {
      const messages = (result.data.messages || []).map(mapBackendMessageToChatMessage);
      set({
        messages,
        currentSessionId: result.data.session_uid || String(result.data.id),
        isThinking: false,
        isHistoryOpen: false,
      });
    } else {
      set({ isThinking: false });
    }
  },

  createNewSession: async (title: string = 'New Welfare Consultation') => {
    set({ isThinking: true, errorMessage: null });
    const result = await advisorRepository.createSession(title);
    if (result.ok && result.data) {
      const key = result.data.session_uid || String(result.data.id);
      set({
        currentSessionId: key,
        messages: [],
        isThinking: false,
        isHistoryOpen: false,
      });
      void get().loadSessions();
      return key;
    }
    set({
      isThinking: false,
      errorMessage: result.ok ? 'Failed to create session' : result.error.message,
    });
    return null;
  },

  deleteSession: async (sessionId: string) => {
    await advisorRepository.deleteSession(sessionId);
    if (get().currentSessionId === sessionId) {
      set({ currentSessionId: null, messages: [] });
    }
    void get().loadSessions();
  },

  retryLastQuery: async () => {
    const query = get().lastFailedQuery;
    if (query) {
      set({ errorMessage: null });
      await get().sendMessage(query);
    }
  },

  sendMessage: async (overrideQuery?: string) => {
    const query = (overrideQuery ?? get().inputText).trim();
    if (!query || get().isThinking) return;

    const timeStr = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date());

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr,
    };

    // Reset thinking steps to pending
    const initialSteps: ThinkingStep[] = INITIAL_THINKING_STEPS.map((s: ThinkingStep) => ({
      ...s,
      status: 'pending',
    }));


    set((state) => ({
      messages: [...state.messages, userMessage],
      inputText: '',
      isThinking: true,
      thinkingSteps: initialSteps,
      errorMessage: null,
      lastFailedQuery: null,
    }));

    // Ensure session ID exists
    let sessionId = get().currentSessionId;
    if (!sessionId) {
      sessionId = (await get().createNewSession('New Welfare Consultation')) || null;
    }

    const result = await advisorRepository.askAdvisor(
      query,
      sessionId || undefined,
      (activeStepIndex: number) => {
        set((state) => ({
          thinkingSteps: state.thinkingSteps.map((step, idx) => ({
            ...step,
            status:
              idx < activeStepIndex
                ? 'completed'
                : idx === activeStepIndex
                ? 'active'
                : 'pending',
          })),
        }));
      }
    );

    if (result.ok) {
      set((state) => ({
        messages: [...state.messages, result.data],
        isThinking: false,
        thinkingSteps: INITIAL_THINKING_STEPS,
      }));
      void get().loadSessions();
    } else {
      // FAIL LOUDLY: Never mask backend errors with mock data!
      const statusPrefix = result.error.statusCode ? `[HTTP ${result.error.statusCode}] ` : '';
      const displayError = `${statusPrefix}${result.error.message || 'AI Advisor service error'}`;

      set({
        isThinking: false,
        thinkingSteps: INITIAL_THINKING_STEPS,
        errorMessage: displayError,
        lastFailedQuery: query,
      });
    }
  },

  resetConversation: () => {
    set({
      messages: [],
      inputText: '',
      isThinking: false,
      thinkingSteps: INITIAL_THINKING_STEPS,
      errorMessage: null,
      lastFailedQuery: null,
    });
  },
}));

chatSyncService.onSyncComplete(() => {
  void useAdvisorStore.getState().loadSessions();
});
