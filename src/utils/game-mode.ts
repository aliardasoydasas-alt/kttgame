import { GAME_MODE_META } from "../constants";
import type { GameMode, ParticipantRecord, QuestionItem } from "../types";

export const DEFAULT_GAME_MODE: GameMode = "landmark";

export function normalizeGameMode(value?: string | null): GameMode {
  return value === "country-map" ? "country-map" : DEFAULT_GAME_MODE;
}

export function getGameModeMeta(mode?: string | null) {
  return GAME_MODE_META[normalizeGameMode(mode)];
}

export function getQuestionGameMode(question: Pick<QuestionItem, "gameMode">) {
  return normalizeGameMode(question.gameMode);
}

export function getParticipantGameMode(participant: Pick<ParticipantRecord, "gameMode">) {
  return normalizeGameMode(participant.gameMode);
}
