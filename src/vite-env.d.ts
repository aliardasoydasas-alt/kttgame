/// <reference types="vite/client" />

import type { AppDatabase, EventCardItem, ParticipantRecord, QuestionItem, SettingsState, WheelOptionsUpdate } from "../electron/types";

declare global {
  interface Window {
    quizApi: {
      getInitialData: () => Promise<AppDatabase>;
      saveParticipant: (participant: ParticipantRecord) => Promise<AppDatabase>;
      updateParticipant: (participant: ParticipantRecord) => Promise<AppDatabase>;
      deleteParticipant: (participantId: string) => Promise<AppDatabase>;
      resetParticipants: () => Promise<AppDatabase>;
      saveSettings: (settings: SettingsState) => Promise<AppDatabase>;
      saveQuestion: (question: QuestionItem) => Promise<AppDatabase>;
      saveEventCards: (eventCards: EventCardItem[]) => Promise<AppDatabase>;
      saveWheelOptions: (update: WheelOptionsUpdate) => Promise<AppDatabase>;
      deleteQuestion: (questionId: string) => Promise<AppDatabase>;
      exportJson: () => Promise<{ success: boolean; filePath?: string }>;
      exportCsv: () => Promise<{ success: boolean; filePath?: string }>;
      importJson: () => Promise<{ success: boolean; data?: AppDatabase }>;
      setFullscreen: (fullscreen: boolean) => Promise<{ success: boolean }>;
      getFullscreen: () => Promise<{ fullscreen: boolean }>;
    };
  }
}

export {};
