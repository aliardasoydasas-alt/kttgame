import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppFrame } from "../components/AppFrame";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { GAME_MODE_META } from "../constants";
import { useAppStore } from "../store/app-store";
import type { GameMode } from "../types";
import { getGameModeMeta, getParticipantGameMode } from "../utils/game-mode";
import { normalizeForSearch } from "../utils/quiz";

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const participants = useAppStore((state) => state.data?.participants ?? []);
  const [search, setSearch] = useState("");
  const [selectedMode, setSelectedMode] = useState<GameMode>(searchParams.get("mode") === "country-map" ? "country-map" : "landmark");

  const filtered = useMemo(() => {
    const query = normalizeForSearch(search.trim());
    const modeFiltered = participants.filter((participant) => getParticipantGameMode(participant) === selectedMode);

    if (!query) {
      return modeFiltered;
    }

    return modeFiltered.filter((participant) =>
      [participant.name, participant.resultLabel, participant.createdAt, getGameModeMeta(getParticipantGameMode(participant)).label].some((value) =>
        normalizeForSearch(value).includes(query)
      )
    );
  }, [participants, search, selectedMode]);

  return (
    <AppFrame subtitle="Lider Tablosu">
      <section className="feature-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Stand Ekrani</div>
            <h2>{GAME_MODE_META[selectedMode].label} Lider Tablosu</h2>
          </div>
          <div className="cta-row">
            <input className="text-input slim" onChange={(event) => setSearch(event.target.value)} placeholder="Isim veya sonuc ara" value={search} />
            <button className="ghost-button" onClick={() => navigate("/")} type="button">
              Ana Sayfa
            </button>
          </div>
        </div>
        <div className="cta-row leaderboard-mode-row">
          <button
            className={`ghost-button ${selectedMode === "landmark" ? "leaderboard-mode-active" : ""}`}
            onClick={() => setSelectedMode("landmark")}
            type="button"
          >
            {GAME_MODE_META.landmark.label}
          </button>
          <button
            className={`ghost-button ${selectedMode === "country-map" ? "leaderboard-mode-active" : ""}`}
            onClick={() => setSelectedMode("country-map")}
            type="button"
          >
            {GAME_MODE_META["country-map"].label}
          </button>
        </div>
        <LeaderboardTable participants={filtered} />
      </section>
    </AppFrame>
  );
}
