import type { EventCardItem, GameMode, RewardOption } from "./types";

export const APP_TITLE = "Kultur ve Turizm Toplulugu";
export const APP_SUBTITLE = "Turizm Bilgi Yarismasi";
export const APP_FOOTER = "Izmir Katip Celebi Universitesi";
export const QUIZ_DURATION_SECONDS = 90;
export const REWARD_THRESHOLD = 12;

export const GAME_MODE_META: Record<
  GameMode,
  {
    label: string;
    shortLabel: string;
    homeTitle: string;
    homeSubtitle: string;
    defaultQuestionText: string;
  }
> = {
  landmark: {
    label: "Turistik Yerler",
    shortLabel: "Yerler",
    homeTitle: "Turistik Yerler",
    homeSubtitle: "Unlu yerleri sec",
    defaultQuestionText: "Bu gorselde one cikan turistik yer hangisidir?"
  },
  "country-map": {
    label: "Ulke Haritalari",
    shortLabel: "Haritalar",
    homeTitle: "Ulke Haritalari",
    homeSubtitle: "Haritadan ulkeyi bul",
    defaultQuestionText: "Bu harita hangi ulkeye aittir?"
  }
};

export const EVENT_CARDS: EventCardItem[] = [
  { id: "event-aquarium", title: "Akvaryum Turu", image: "/questions/ha-long-bay.jpg" },
  { id: "event-cinema", title: "Sinema Etkinligi", image: "/questions/sydney-opera-house.jpg" },
  { id: "event-fethiye", title: "Fethiye Turu", image: "/questions/oludeniz.jpg" },
  { id: "event-pamukkale", title: "Pamukkale Turu", image: "/questions/pamukkale-travertenleri.jpg" },
  { id: "event-eskisehir", title: "Eskisehir Turu", image: "/questions/eskisehir-odunpazari.jpg" },
  { id: "event-quiz", title: "Quiz Night", image: "/questions/galata-kulesi.jpg" },
  { id: "event-speaking", title: "Speaking Club", image: "/questions/big-ben.jpg" }
];

export const REWARD_WHEEL_OPTIONS: RewardOption[] = [
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

export const PENALTY_WHEEL_OPTIONS: RewardOption[] = [
  { id: "penalty-tekrar-cevir", label: "Tekrar Cevir", shortLabel: "TKR", weight: 50, segmentCount: 4, tone: "#4361ee" },
  { id: "penalty-ceza", label: "Ceza", shortLabel: "CEZ", weight: 50, segmentCount: 4, tone: "#ff5f45" }
];

export const PENALTY_TEXTS = [
  "Stand ekibine turizm slogani soyle",
  "Bir sehri 10 saniyede tanit",
  "Ingilizce bir cumleyle kendini tanit",
  "Pamukkale'yi turist gibi anlat",
  "Favori gezi rotani iki cumlede sat",
  "Bir tarihi yeri rehber gibi anlat"
];
