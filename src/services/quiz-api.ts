import { COUNTRY_MAP_QUESTION_BANK } from "../../electron/generated/country-map-question-bank";
import { DEFAULT_QUESTION_BANK } from "../../electron/generated/question-bank";
import { EVENT_CARDS, PENALTY_WHEEL_OPTIONS, REWARD_WHEEL_OPTIONS } from "../constants";
import type { AppDatabase, EventCardItem, GameMode, ParticipantRecord, QuestionItem, RewardOption, SettingsState, WheelOptionsUpdate } from "../types";
import { calculateNetCorrect } from "../utils/quiz";

const STORAGE_KEY = "kultur-turizm-quiz-browser-db";

type QuizApiShape = typeof window.quizApi;

function cloneWheelOptions(options: RewardOption[]) {
  return options.map((option) => ({ ...option }));
}

function cloneEventCards(eventCards: EventCardItem[]) {
  return eventCards.map((eventCard) => ({ ...eventCard }));
}

function isLegacyBundledEventImage(image: string) {
  return image.startsWith("/questions/");
}

function normalizeGameMode(value?: string | null): GameMode {
  return value === "country-map" ? "country-map" : "landmark";
}

function normalizeQuestions(questions: QuestionItem[] | undefined, fallback: QuestionItem[]) {
  const source = questions?.length ? questions : fallback;
  return source.map((question) => ({
    ...question,
    gameMode: normalizeGameMode(question.gameMode)
  }));
}

function ensureQuestionModes(questions: QuestionItem[], defaults: QuestionItem[]) {
  const normalizedCurrent = normalizeQuestions(questions, defaults);
  const hasLandmark = normalizedCurrent.some((question) => normalizeGameMode(question.gameMode) === "landmark");
  const hasCountryMap = normalizedCurrent.some((question) => normalizeGameMode(question.gameMode) === "country-map");

  const additions: QuestionItem[] = [];

  if (!hasLandmark) {
    additions.push(...defaults.filter((question) => normalizeGameMode(question.gameMode) === "landmark"));
  }

  if (!hasCountryMap) {
    additions.push(...defaults.filter((question) => normalizeGameMode(question.gameMode) === "country-map"));
  }

  return [...normalizedCurrent, ...additions];
}

function normalizeParticipants(participants: ParticipantRecord[] | undefined) {
  return (participants ?? []).map((participant) => ({
    ...participant,
    gameMode: normalizeGameMode(participant.gameMode)
  }));
}

function buildDefaultQuestionBank() {
  return normalizeQuestions([...DEFAULT_QUESTION_BANK, ...COUNTRY_MAP_QUESTION_BANK], []);
}

function normalizeEventCards(eventCards: EventCardItem[] | undefined, fallback: EventCardItem[]) {
  if (!eventCards?.length) {
    return cloneEventCards(fallback);
  }

  const normalized: EventCardItem[] = [];

  for (const [index, eventCard] of eventCards.entries()) {
    const fallbackCard = fallback[index % fallback.length] ?? fallback[0];
    const title = eventCard.title?.trim();
    const image = eventCard.image?.trim();
    if (!title || !image) {
      continue;
    }

    normalized.push({
      id: eventCard.id?.trim() || `event-${index + 1}`,
      title,
      image: isLegacyBundledEventImage(image) ? fallbackCard.image : image || fallbackCard.image
    });
  }

  return normalized.length ? normalized : cloneEventCards(fallback);
}

function normalizeWheelOptions(options: RewardOption[] | undefined, fallback: RewardOption[], prefix: string) {
  if (!options?.length) {
    return cloneWheelOptions(fallback);
  }

  const normalized: RewardOption[] = [];

  for (const [index, option] of options.entries()) {
    const fallbackOption = fallback[index % fallback.length] ?? fallback[0];
    const label = option.label?.trim();
    if (!label) {
      continue;
    }

    normalized.push({
      id: option.id?.trim() || `${prefix}-${index + 1}`,
      label,
      shortLabel: option.shortLabel?.trim() || label.slice(0, 3).toUpperCase(),
      segmentCount: Number.isFinite(option.segmentCount) ? Math.max(1, Math.round(Number(option.segmentCount))) : fallbackOption.segmentCount ?? 1,
      weight: Number.isFinite(option.weight) ? Math.max(0.1, Number(option.weight)) : fallbackOption.weight,
      tone: option.tone?.trim() || fallbackOption.tone
    });
  }

  return normalized.length ? normalized : cloneWheelOptions(fallback);
}

function createBrowserDefaultDatabase(): AppDatabase {
  return {
    participants: [],
    questions: buildDefaultQuestionBank(),
    eventCards: cloneEventCards(EVENT_CARDS),
    rewardWheelOptions: cloneWheelOptions(REWARD_WHEEL_OPTIONS),
    penaltyWheelOptions: cloneWheelOptions(PENALTY_WHEEL_OPTIONS),
    settings: {
      adminPassword: "1234",
      soundEnabled: true
    }
  };
}

function readBrowserDatabase() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createBrowserDefaultDatabase();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as AppDatabase;
    const defaults = createBrowserDefaultDatabase();
    return {
      ...defaults,
      ...parsed,
      participants: normalizeParticipants(sortParticipants(parsed.participants ?? [])),
      questions: ensureQuestionModes(parsed.questions ?? [], defaults.questions),
      eventCards: normalizeEventCards(parsed.eventCards, defaults.eventCards),
      rewardWheelOptions: normalizeWheelOptions(parsed.rewardWheelOptions, defaults.rewardWheelOptions, "reward"),
      penaltyWheelOptions: normalizeWheelOptions(parsed.penaltyWheelOptions, defaults.penaltyWheelOptions, "penalty"),
      settings: { ...defaults.settings, ...(parsed.settings ?? {}) }
    };
  } catch {
    const fallback = createBrowserDefaultDatabase();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

function writeBrowserDatabase(data: AppDatabase) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function sortParticipants(participants: ParticipantRecord[]) {
  return [...participants].sort((left, right) => {
    const rightNet = calculateNetCorrect(right.correctCount, right.wrongCount);
    const leftNet = calculateNetCorrect(left.correctCount, left.wrongCount);

    if (rightNet !== leftNet) {
      return rightNet - leftNet;
    }

    if (right.correctCount !== left.correctCount) {
      return right.correctCount - left.correctCount;
    }

    if (right.accuracyRate !== left.accuracyRate) {
      return right.accuracyRate - left.accuracyRate;
    }

    if (left.wrongCount !== right.wrongCount) {
      return left.wrongCount - right.wrongCount;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

function createBrowserApi(): QuizApiShape {
  return {
    getInitialData: async () => readBrowserDatabase(),
    saveParticipant: async (participant: ParticipantRecord) => {
      const data = readBrowserDatabase();
      const existingIndex = data.participants.findIndex((item) => item.id === participant.id);
      if (existingIndex === -1) {
        data.participants.push(participant);
      } else {
        data.participants[existingIndex] = participant;
      }
      data.participants = sortParticipants(normalizeParticipants(data.participants));
      return writeBrowserDatabase(data);
    },
    updateParticipant: async (participant: ParticipantRecord) => {
      const data = readBrowserDatabase();
      const existingIndex = data.participants.findIndex((item) => item.id === participant.id);
      if (existingIndex !== -1) {
        data.participants[existingIndex] = participant;
      }
      data.participants = sortParticipants(normalizeParticipants(data.participants));
      return writeBrowserDatabase(data);
    },
    deleteParticipant: async (participantId: string) => {
      const data = readBrowserDatabase();
      data.participants = data.participants.filter((item) => item.id !== participantId);
      return writeBrowserDatabase(data);
    },
    resetParticipants: async () => {
      const data = readBrowserDatabase();
      data.participants = [];
      return writeBrowserDatabase(data);
    },
    saveSettings: async (settings: SettingsState) => {
      const data = readBrowserDatabase();
      data.settings = { ...data.settings, ...settings };
      return writeBrowserDatabase(data);
    },
    saveQuestion: async (question: QuestionItem) => {
      const data = readBrowserDatabase();
      const existingIndex = data.questions.findIndex((item) => item.id === question.id);
      if (existingIndex === -1) {
        data.questions.push(question);
      } else {
        data.questions[existingIndex] = question;
      }
      data.questions = ensureQuestionModes(data.questions, createBrowserDefaultDatabase().questions);
      return writeBrowserDatabase(data);
    },
    saveEventCards: async (eventCards: EventCardItem[]) => {
      const data = readBrowserDatabase();
      data.eventCards = normalizeEventCards(eventCards, createBrowserDefaultDatabase().eventCards);
      return writeBrowserDatabase(data);
    },
    saveWheelOptions: async (update: WheelOptionsUpdate) => {
      const data = readBrowserDatabase();
      if (update.rewardWheelOptions) {
        data.rewardWheelOptions = normalizeWheelOptions(update.rewardWheelOptions, REWARD_WHEEL_OPTIONS, "reward");
      }
      if (update.penaltyWheelOptions) {
        data.penaltyWheelOptions = normalizeWheelOptions(update.penaltyWheelOptions, PENALTY_WHEEL_OPTIONS, "penalty");
      }
      return writeBrowserDatabase(data);
    },
    deleteQuestion: async (questionId: string) => {
      const data = readBrowserDatabase();
      data.questions = data.questions.filter((item) => item.id !== questionId);
      return writeBrowserDatabase(data);
    },
    exportJson: async () => ({ success: false }),
    exportCsv: async () => ({ success: false }),
    importJson: async () => ({ success: false }),
    setFullscreen: async () => ({ success: true }),
    getFullscreen: async () => ({ fullscreen: false })
  };
}

export const quizApi = typeof window.quizApi === "undefined" ? createBrowserApi() : window.quizApi;
