import { create } from "zustand";
import { quizApi } from "../services/quiz-api";
import type { AppDatabase, EventCardItem, ParticipantDraft, ParticipantRecord, QuestionItem, QuizRunState, SettingsState, ToastState, WheelOptionsUpdate } from "../types";
import { getQuestionGameMode } from "../utils/game-mode";
import { buildQuestionSequence } from "../utils/quiz";

interface AppStoreState {
  data: AppDatabase | null;
  loading: boolean;
  error: string | null;
  fullscreen: boolean;
  adminAuthenticated: boolean;
  currentDraft: ParticipantDraft | null;
  currentRun: QuizRunState | null;
  latestResult: ParticipantRecord | null;
  toast: ToastState | null;
  initialize: () => Promise<void>;
  syncData: (data: AppDatabase) => void;
  dismissToast: () => void;
  showToast: (message: string, tone?: ToastState["tone"]) => void;
  setFullscreen: (fullscreen: boolean) => Promise<void>;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  setParticipantDraft: (draft: ParticipantDraft | null) => void;
  startQuizRun: () => boolean;
  clearRun: () => void;
  setLatestResult: (participant: ParticipantRecord | null) => void;
  saveParticipant: (participant: ParticipantRecord) => Promise<void>;
  updateParticipant: (participant: ParticipantRecord) => Promise<void>;
  deleteParticipant: (participantId: string) => Promise<void>;
  resetParticipants: () => Promise<void>;
  saveQuestion: (question: QuestionItem) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  saveEventCards: (eventCards: EventCardItem[]) => Promise<void>;
  saveWheelOptions: (update: WheelOptionsUpdate) => Promise<void>;
  saveSettings: (settings: SettingsState) => Promise<void>;
  importJson: () => Promise<boolean>;
  exportJson: () => Promise<boolean>;
  exportCsv: () => Promise<boolean>;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  data: null,
  loading: true,
  error: null,
  fullscreen: true,
  adminAuthenticated: false,
  currentDraft: null,
  currentRun: null,
  latestResult: null,
  toast: null,
  initialize: async () => {
    try {
      const [data, fullscreen] = await Promise.all([quizApi.getInitialData(), quizApi.getFullscreen()]);
      set({ data, loading: false, error: null, fullscreen: fullscreen.fullscreen });
    } catch {
      set({
        loading: false,
        error: "Uygulama verileri yüklenemedi. Lütfen uygulamayı yeniden başlatın."
      });
    }
  },
  syncData: (data) => set({ data }),
  dismissToast: () => set({ toast: null }),
  showToast: (message, tone = "info") =>
    set({
      toast: {
        id: crypto.randomUUID(),
        message,
        tone
      }
    }),
  setFullscreen: async (fullscreen) => {
    await quizApi.setFullscreen(fullscreen);
    set({ fullscreen });
  },
  loginAdmin: (password) => {
    const valid = password === (get().data?.settings.adminPassword ?? "1234");
    set({ adminAuthenticated: valid });
    return valid;
  },
  logoutAdmin: () => set({ adminAuthenticated: false }),
  setParticipantDraft: (draft) => set({ currentDraft: draft }),
  startQuizRun: () => {
    const draft = get().currentDraft;
    const questions = get().data?.questions ?? [];
    if (!draft || !questions.length) {
      return false;
    }

    const eligibleQuestions = questions.filter((question) => getQuestionGameMode(question) === draft.gameMode);
    if (!eligibleQuestions.length) {
      get().showToast("Secilen oyun icin soru havuzu bulunamadi.", "error");
      return false;
    }

    set({
      currentRun: {
        participant: draft,
        questionOrder: buildQuestionSequence(eligibleQuestions),
        correctCount: 0,
        wrongCount: 0,
        totalAnswered: 0,
        startedAt: draft.createdAt,
        gameMode: draft.gameMode
      },
      latestResult: null
    });
    return true;
  },
  clearRun: () => set({ currentRun: null, currentDraft: null }),
  setLatestResult: (participant) => set({ latestResult: participant }),
  saveParticipant: async (participant) => {
    const data = await quizApi.saveParticipant(participant);
    set({ data });
  },
  updateParticipant: async (participant) => {
    const data = await quizApi.updateParticipant(participant);
    set({ data });
  },
  deleteParticipant: async (participantId) => {
    const data = await quizApi.deleteParticipant(participantId);
    set({ data });
  },
  resetParticipants: async () => {
    const data = await quizApi.resetParticipants();
    set({ data });
  },
  saveQuestion: async (question) => {
    const data = await quizApi.saveQuestion(question);
    set({ data });
  },
  saveEventCards: async (eventCards) => {
    const data = await quizApi.saveEventCards(eventCards);
    set({ data });
  },
  saveWheelOptions: async (update) => {
    const data = await quizApi.saveWheelOptions(update);
    set({ data });
  },
  deleteQuestion: async (questionId) => {
    const data = await quizApi.deleteQuestion(questionId);
    set({ data });
  },
  saveSettings: async (settings) => {
    const data = await quizApi.saveSettings(settings);
    set({ data });
  },
  importJson: async () => {
    const result = await quizApi.importJson();
    if (result.success && result.data) {
      set({ data: result.data });
    }
    return result.success;
  },
  exportJson: async () => {
    const result = await quizApi.exportJson();
    return result.success;
  },
  exportCsv: async () => {
    const result = await quizApi.exportCsv();
    return result.success;
  }
}));
