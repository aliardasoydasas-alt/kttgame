import type { GameMode, ParticipantRecord, QuestionItem, RewardOption } from "../types";
import { normalizeGameMode } from "./game-mode";

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function interleaveByDifficulty(questions: QuestionItem[]) {
  const buckets = {
    easy: shuffle(questions.filter((question) => question.difficulty === "easy")),
    medium: shuffle(questions.filter((question) => question.difficulty === "medium")),
    hard: shuffle(questions.filter((question) => question.difficulty === "hard"))
  };

  const pattern: Array<keyof typeof buckets> = ["medium", "easy", "hard", "easy"];
  const ordered: QuestionItem[] = [];

  while (buckets.easy.length || buckets.medium.length || buckets.hard.length) {
    for (const difficulty of pattern) {
      const next = buckets[difficulty].shift();
      if (next) {
        ordered.push(next);
      }
    }
  }

  return ordered;
}

function reduceConsecutiveSimilarQuestions(questions: QuestionItem[]) {
  const pending = [...questions];
  const ordered: QuestionItem[] = [];

  while (pending.length) {
    const previous = ordered[ordered.length - 1];
    // Aynı şehir veya ülke art arda gelmesin diye sıradaki güvenli adayı öne çekiyoruz.
    const nextIndex = pending.findIndex(
      (question) =>
        !previous ||
        (question.city !== previous.city && question.country !== previous.country && question.correctAnswer !== previous.correctAnswer)
    );

    const safeIndex = nextIndex >= 0 ? nextIndex : 0;
    ordered.push(pending.splice(safeIndex, 1)[0]);
  }

  return ordered;
}

export function buildQuestionSequence(questions: QuestionItem[]) {
  return reduceConsecutiveSimilarQuestions(interleaveByDifficulty(questions));
}

export function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(isoDate));
}

export function calculateAccuracy(correctCount: number, totalAnswered: number) {
  if (!totalAnswered) {
    return 0;
  }

  return Math.round((correctCount / totalAnswered) * 1000) / 10;
}

export function calculatePenaltyBlocks(wrongCount: number) {
  return Math.floor(wrongCount / 4);
}

export function calculateNetCorrect(correctCount: number, wrongCount: number) {
  return Math.max(0, correctCount - calculatePenaltyBlocks(wrongCount));
}

export function createParticipantRecord(input: {
  id: string;
  name: string;
  photoDataUrl?: string;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  askedQuestionIds: string[];
  resultType: ParticipantRecord["resultType"];
  resultLabel: string;
  createdAt: string;
  gameMode: GameMode;
}) {
  const now = new Date().toISOString();
  return {
    id: input.id,
    name: input.name,
    photoDataUrl: input.photoDataUrl,
    correctCount: input.correctCount,
    wrongCount: input.wrongCount,
    totalAnswered: input.totalAnswered,
    accuracyRate: calculateAccuracy(input.correctCount, input.totalAnswered),
    askedQuestionIds: input.askedQuestionIds,
    resultType: input.resultType,
    resultLabel: input.resultLabel,
    createdAt: input.createdAt,
    updatedAt: now,
    gameMode: normalizeGameMode(input.gameMode)
  } satisfies ParticipantRecord;
}

export function weightedPick(options: RewardOption[]) {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const option of options) {
    threshold -= option.weight;
    if (threshold <= 0) {
      return option;
    }
  }

  return options[options.length - 1];
}

export function buildWheelGradient(options: RewardOption[]) {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  let cursor = 0;
  const stops = options.map((option) => {
    const start = (cursor / totalWeight) * 100;
    cursor += option.weight;
    const end = (cursor / totalWeight) * 100;
    return `${option.tone} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export function normalizeForSearch(value: string) {
  return value.toLocaleLowerCase("tr-TR");
}
