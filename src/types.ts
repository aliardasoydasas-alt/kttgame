import type { AppDatabase, EventCardItem, GameMode, ParticipantRecord, QuestionItem, RewardOption, SettingsState, WheelOptionsUpdate } from "../electron/types";

export type { AppDatabase, EventCardItem, GameMode, ParticipantRecord, QuestionItem, RewardOption, SettingsState, WheelOptionsUpdate };

export interface ParticipantDraft {
  id: string;
  name: string;
  photoDataUrl?: string;
  createdAt: string;
  gameMode: GameMode;
}

export interface QuizRunState {
  participant: ParticipantDraft;
  questionOrder: QuestionItem[];
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  startedAt: string;
  gameMode: GameMode;
}

export interface ToastState {
  id: string;
  tone: "success" | "error" | "info";
  message: string;
}
