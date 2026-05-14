export type DifficultyLevel = "easy" | "medium" | "hard";
export type GameMode = "landmark" | "country-map";

export interface QuestionItem {
  id: string;
  image: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  city: string;
  country: string;
  difficulty: DifficultyLevel;
  gameMode?: GameMode;
}

export interface ParticipantRecord {
  id: string;
  name: string;
  photoDataUrl?: string;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  accuracyRate: number;
  askedQuestionIds: string[];
  resultType: "reward" | "penalty" | "no-reward" | "pending";
  resultLabel: string;
  createdAt: string;
  updatedAt: string;
  gameMode?: GameMode;
}

export interface RewardOption {
  id: string;
  label: string;
  shortLabel?: string;
  segmentCount?: number;
  weight: number;
  tone: string;
}

export interface EventCardItem {
  id: string;
  image: string;
  title: string;
}

export interface WheelOptionsUpdate {
  rewardWheelOptions?: RewardOption[];
  penaltyWheelOptions?: RewardOption[];
}

export interface SettingsState {
  adminPassword: string;
  soundEnabled: boolean;
}

export interface AppDatabase {
  participants: ParticipantRecord[];
  questions: QuestionItem[];
  eventCards: EventCardItem[];
  rewardWheelOptions: RewardOption[];
  penaltyWheelOptions: RewardOption[];
  settings: SettingsState;
}

export interface ImportPayload {
  participants?: ParticipantRecord[];
  questions?: QuestionItem[];
  eventCards?: EventCardItem[];
  rewardWheelOptions?: RewardOption[];
  penaltyWheelOptions?: RewardOption[];
  settings?: Partial<SettingsState>;
}
