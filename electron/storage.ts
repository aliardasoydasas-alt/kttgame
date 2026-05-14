import type { AppDatabase, EventCardItem, GameMode, ImportPayload, ParticipantRecord, QuestionItem, RewardOption } from "./types";
import { COUNTRY_MAP_QUESTION_BANK } from "./generated/country-map-question-bank";
import { DEFAULT_QUESTION_BANK } from "./generated/question-bank";

const DEFAULT_REWARD_WHEEL_OPTIONS: RewardOption[] = [
  { id: "reward-sticker", label: "Sticker", shortLabel: "STK", weight: 30, segmentCount: 6, tone: "#ff5f45" },
  { id: "reward-canta", label: "Canta", shortLabel: "CNT", weight: 10, segmentCount: 2, tone: "#ff9f1c" },
  { id: "reward-kalemlik", label: "Kalemlik", shortLabel: "KLM", weight: 10, segmentCount: 2, tone: "#ffd166" },
  { id: "reward-magnet", label: "Magnet", shortLabel: "MGN", weight: 10, segmentCount: 2, tone: "#06d6a0" },
  { id: "reward-figur", label: "Figur", shortLabel: "FGR", weight: 20, segmentCount: 4, tone: "#118ab2" },
  { id: "reward-indirim", label: "Tur Indirimi", shortLabel: "IND", weight: 7, segmentCount: 2, tone: "#7b2cbf" },
  { id: "reward-ucretsiz-tur", label: "Ucretsiz Tur", shortLabel: "TUR", weight: 1, segmentCount: 1, tone: "#2dc653" },
  { id: "reward-pass-1", label: "Pass", shortLabel: "PAS", weight: 1, segmentCount: 1, tone: "#f72585" },
  { id: "reward-pass-2", label: "Pass", shortLabel: "PAS", weight: 1, segmentCount: 1, tone: "#b5179e" },
  { id: "reward-tekrar-cevir-1", label: "Tekrar Cevir", shortLabel: "TKR", weight: 10, segmentCount: 2, tone: "#577590" },
  { id: "reward-tekrar-cevir-2", label: "Tekrar Cevir", shortLabel: "TKR", weight: 10, segmentCount: 2, tone: "#4361ee" }
];

const DEFAULT_PENALTY_WHEEL_OPTIONS: RewardOption[] = [
  { id: "penalty-tekrar-cevir", label: "Tekrar Cevir", shortLabel: "TKR", weight: 50, segmentCount: 4, tone: "#4361ee" },
  { id: "penalty-ceza", label: "Ceza", shortLabel: "CEZ", weight: 50, segmentCount: 4, tone: "#ff5f45" }
];

const DEFAULT_EVENT_CARDS: EventCardItem[] = [
  { id: "event-aquarium", title: "Akvaryum Turu", image: "/questions/ha-long-bay.jpg" },
  { id: "event-cinema", title: "Sinema Etkinligi", image: "/questions/sydney-opera-house.jpg" },
  { id: "event-fethiye", title: "Fethiye Turu", image: "/questions/oludeniz.jpg" },
  { id: "event-pamukkale", title: "Pamukkale Turu", image: "/questions/pamukkale-travertenleri.jpg" },
  { id: "event-eskisehir", title: "Eskisehir Turu", image: "/questions/eskisehir-odunpazari.jpg" },
  { id: "event-quiz", title: "Quiz Night", image: "/questions/galata-kulesi.jpg" },
  { id: "event-speaking", title: "Speaking Club", image: "/questions/big-ben.jpg" }
];

function calculatePenaltyBlocks(wrongCount: number) {
  return Math.floor(wrongCount / 4);
}

function calculateNetCorrect(correctCount: number, wrongCount: number) {
  return Math.max(0, correctCount - calculatePenaltyBlocks(wrongCount));
}

function cloneWheelOptions(options: RewardOption[]) {
  return options.map((option) => ({ ...option }));
}

function cloneEventCards(eventCards: EventCardItem[]) {
  return eventCards.map((eventCard) => ({ ...eventCard }));
}

function normalizeGameMode(value?: string | null): GameMode {
  return value === "country-map" ? "country-map" : "landmark";
}

export function normalizeQuestions(questions: QuestionItem[] | undefined, fallback: QuestionItem[]) {
  const source = questions?.length ? questions : fallback;
  return source.map((question) => ({
    ...question,
    gameMode: normalizeGameMode(question.gameMode)
  }));
}

export function ensureQuestionModes(questions: QuestionItem[], defaults: QuestionItem[]) {
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

export function normalizeParticipants(participants: ParticipantRecord[] | undefined) {
  return (participants ?? []).map((participant) => ({
    ...participant,
    gameMode: normalizeGameMode(participant.gameMode)
  }));
}

function buildDefaultQuestionBank() {
  return normalizeQuestions([...DEFAULT_QUESTION_BANK, ...COUNTRY_MAP_QUESTION_BANK], []);
}

export function normalizeEventCards(eventCards: EventCardItem[] | undefined, fallback: EventCardItem[]) {
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
      image: image || fallbackCard.image
    });
  }

  return normalized.length ? normalized : cloneEventCards(fallback);
}

export function normalizeWheelOptions(options: RewardOption[] | undefined, fallback: RewardOption[], prefix: string) {
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

    const shortLabel = option.shortLabel?.trim() || label.slice(0, 3).toUpperCase();
    const weight = Number.isFinite(option.weight) ? Math.max(0.1, Number(option.weight)) : fallbackOption.weight;
    const segmentCount = Number.isFinite(option.segmentCount)
      ? Math.max(1, Math.round(Number(option.segmentCount)))
      : Math.max(1, fallbackOption.segmentCount ?? 1);
    const tone = option.tone?.trim() || fallbackOption.tone;
    const id = option.id?.trim() || `${prefix}-${index + 1}`;

    normalized.push({
      id,
      label,
      shortLabel,
      segmentCount,
      weight,
      tone
    });
  }

  if (!normalized.length) {
    return cloneWheelOptions(fallback);
  }

  return normalized;
}

export function createDefaultDatabase(): AppDatabase {
  return {
    participants: [],
    questions: buildDefaultQuestionBank(),
    eventCards: cloneEventCards(DEFAULT_EVENT_CARDS),
    rewardWheelOptions: cloneWheelOptions(DEFAULT_REWARD_WHEEL_OPTIONS),
    penaltyWheelOptions: cloneWheelOptions(DEFAULT_PENALTY_WHEEL_OPTIONS),
    settings: {
      adminPassword: "1234",
      soundEnabled: true
    }
  };
}

export function sortLeaderboard(participants: ParticipantRecord[]) {
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

export function upsertParticipant(participants: ParticipantRecord[], participant: ParticipantRecord) {
  const next = [...participants];
  const index = next.findIndex((item) => item.id === participant.id);

  if (index === -1) {
    next.push(participant);
  } else {
    next[index] = participant;
  }

  return next;
}

export function upsertQuestion(questions: QuestionItem[], question: QuestionItem) {
  const next = [...questions];
  const index = next.findIndex((item) => item.id === question.id);

  if (index === -1) {
    next.push(question);
  } else {
    next[index] = question;
  }

  return next;
}

export function serializeAsJson(data: AppDatabase) {
  return JSON.stringify(data, null, 2);
}

function escapeCsvCell(value: string | number) {
  const normalized = String(value).replace(/"/g, "\"\"");
  return `"${normalized}"`;
}

export function serializeAsCsv(participants: ParticipantRecord[]) {
  const header = [
    "ID",
    "Ad",
    "OyunModu",
    "Dogru",
    "Yanlis",
    "NetDogru",
    "CezaBloku",
    "Toplam",
    "BasariOrani",
    "SonucTuru",
    "Sonuc",
    "Tarih"
  ];

  const rows = participants.map((participant) => [
    participant.id,
    participant.name,
    normalizeGameMode(participant.gameMode),
    participant.correctCount,
    participant.wrongCount,
    calculateNetCorrect(participant.correctCount, participant.wrongCount),
    calculatePenaltyBlocks(participant.wrongCount),
    participant.totalAnswered,
    participant.accuracyRate,
    participant.resultType,
    participant.resultLabel,
    participant.createdAt
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function parseImportPayload(raw: string): ImportPayload {
  const parsed = JSON.parse(raw) as ImportPayload;

  return {
    participants: parsed.participants ? normalizeParticipants(parsed.participants) : undefined,
    questions: parsed.questions ? normalizeQuestions(parsed.questions, buildDefaultQuestionBank()) : undefined,
    eventCards: parsed.eventCards ? normalizeEventCards(parsed.eventCards, DEFAULT_EVENT_CARDS) : undefined,
    rewardWheelOptions: parsed.rewardWheelOptions
      ? normalizeWheelOptions(parsed.rewardWheelOptions, DEFAULT_REWARD_WHEEL_OPTIONS, "reward")
      : undefined,
    penaltyWheelOptions: parsed.penaltyWheelOptions
      ? normalizeWheelOptions(parsed.penaltyWheelOptions, DEFAULT_PENALTY_WHEEL_OPTIONS, "penalty")
      : undefined,
    settings: parsed.settings ?? {}
  };
}
