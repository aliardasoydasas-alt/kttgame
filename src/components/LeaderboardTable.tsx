import type { ParticipantRecord } from "../types";
import { resolveAssetPath } from "../utils/assets";
import { getGameModeMeta, getParticipantGameMode } from "../utils/game-mode";
import { calculateNetCorrect, formatDateTime } from "../utils/quiz";

interface LeaderboardTableProps {
  participants: ParticipantRecord[];
  compact?: boolean;
}

export function LeaderboardTable({ participants, compact = false }: LeaderboardTableProps) {
  return (
    <div className={`leaderboard-table ${compact ? "compact" : ""}`}>
      <div className="leaderboard-row header">
        <span>#</span>
        <span>Yarismaci</span>
        <span>Dogru</span>
        <span>Yanlis</span>
        <span>Net</span>
        <span>Basari</span>
        <span>Sonuc</span>
        <span>Tarih</span>
      </div>
      {participants.map((participant, index) => (
        <div className="leaderboard-row" key={participant.id}>
          <span className="rank-chip">{index + 1}</span>
          <span className="player-cell">
            <img
              className="avatar-thumb"
              src={participant.photoDataUrl || resolveAssetPath("/ui/image-fallback.svg")}
              onError={(event) => {
                event.currentTarget.src = resolveAssetPath("/ui/image-fallback.svg");
              }}
            />
            <span className="player-copy">
              <strong>{participant.name}</strong>
              <small>{getGameModeMeta(getParticipantGameMode(participant)).label}</small>
            </span>
          </span>
          <span>{participant.correctCount}</span>
          <span>{participant.wrongCount}</span>
          <span>{calculateNetCorrect(participant.correctCount, participant.wrongCount)}</span>
          <span>%{participant.accuracyRate}</span>
          <span>{participant.resultLabel}</span>
          <span>{formatDateTime(participant.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
