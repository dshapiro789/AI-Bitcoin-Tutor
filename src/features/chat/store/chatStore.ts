import { create } from 'zustand';
import { Message, AIModel, ChatSession } from '../types';
import { defaultModels } from '../../../services/ai';

interface ChatUIState {
  input: string;
  showSettings: boolean;
  showAdvanced: string | null;
  showWelcomeScreen: boolean;
  showChatHistory: boolean;
  showShareExportModal: boolean;
  showClearConfirm: boolean;
  showDeleteConfirm: boolean;
  modelToDelete: string | null;
  showScrollToTop: boolean;
  editingSession: string | null;
  editTitle: string;
  deleteConfirm: string | null;
}

interface ChatDataState {
  messages: Message[];
  models: AIModel[];
  currentSessionId: string | null;
  chatSessions: ChatSession[];
  currentThoughts: string | null;
  contextMemory: number;
  starterQuestions: string[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}

interface ChatActions {
  // UI Actions
  setInput: (input: string) => void;
  setShowSettings: (show: boolean) => void;
  setShowAdvanced: (modelId: string | null) => void;
  setShowWelcomeScreen: (show: boolean) => void;
  setShowChatHistory: (show: boolean) => void;
  setShowShareExportModal: (show: boolean) => void;
  setShowClearConfirm: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  setModelToDelete: (modelId: string | null) => void;
  setShowScrollToTop: (show: boolean) => void;
  setEditingSession: (sessionId: string | null) => void;
  setEditTitle: (title: string) => void;
  setDeleteConfirm: (sessionId: string | null) => void;

  // Data Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setModels: (models: AIModel[]) => void;
  updateModel: (modelId: string, updates: Partial<AIModel>) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  setChatSessions: (sessions: ChatSession[]) => void;
  setCurrentThoughts: (thoughts: string | null) => void;
  setContextMemory: (memory: number) => void;
  setStarterQuestions: (questions: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;

  // Reset Actions
  resetUI: () => void;
  resetData: () => void;
  resetAll: () => void;
}

type ChatStore = ChatUIState & ChatDataState & ChatActions;

const initialUIState: ChatUIState = {
  input: '',
  showSettings: false,
  showAdvanced: null,
  showWelcomeScreen: false,
  showChatHistory: false,
  showShareExportModal: false,
  showClearConfirm: false,
  showDeleteConfirm: false,
  modelToDelete: null,
  showScrollToTop: false,
  editingSession: null,
  editTitle: '',
  deleteConfirm: null,
};

const initialDataState: ChatDataState = {
  messages: [],
  models: defaultModels,
  currentSessionId: null,
  chatSessions: [],
  currentThoughts: null,
  contextMemory: 0,
  starterQuestions: [],
  isLoading: false,
  isProcessing: false,
  error: null,
};

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialUIState,
  ...initialDataState,

  // UI Actions
  setInput: (input) => set({ input }),
  setShowSettings: (showSettings) => set({ showSettings }),
  setShowAdvanced: (showAdvanced) => set({ showAdvanced }),
  setShowWelcomeScreen: (showWelcomeScreen) => set({ showWelcomeScreen }),
  setShowChatHistory: (showChatHistory) => set({ showChatHistory }),
  setShowShareExportModal: (showShareExportModal) => set({ showShareExportModal }),
  setShowClearConfirm: (showClearConfirm) => set({ showClearConfirm }),
  setShowDeleteConfirm: (showDeleteConfirm) => set({ showDeleteConfirm }),
  setModelToDelete: (modelToDelete) => set({ modelToDelete }),
  setShowScrollToTop: (showScrollToTop) => set({ showScrollToTop }),
  setEditingSession: (editingSession) => set({ editingSession }),
  setEditTitle: (editTitle) => set({ editTitle }),
  setDeleteConfirm: (deleteConfirm) => set({ deleteConfirm }),

  // Data Actions
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setModels: (models) => set({ models }),
  updateModel: (modelId, updates) => set((state) => ({
    models: state.models.map(model => 
      model.id === modelId ? { ...model, ...updates } : model
    )
  })),
  setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
  setChatSessions: (chatSessions) => set({ chatSessions }),
  setCurrentThoughts: (currentThoughts) => set({ currentThoughts }),
  setContextMemory: (contextMemory) => set({ contextMemory }),
  setStarterQuestions: (starterQuestions) => set({ starterQuestions }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),

  // Reset Actions
  resetUI: () => set(initialUIState),
  resetData: () => set(initialDataState),
  resetAll: () => set({ ...initialUIState, ...initialDataState }),
}));