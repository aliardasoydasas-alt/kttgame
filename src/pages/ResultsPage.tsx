import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppFrame } from "../components/AppFrame";
import { SpinWheel, type SpinWheelResolution } from "../components/SpinWheel";
import { REWARD_THRESHOLD, REWARD_WHEEL_OPTIONS } from "../constants";
import { useAppStore } from "../store/app-store";
import type { ParticipantDraft } from "../types";
import { resolveAssetPath } from "../utils/assets";
import { playSoundEffect } from "../utils/audio";
import { getGameModeMeta } from "../utils/game-mode";
import { calculateNetCorrect, calculatePenaltyBlocks, createParticipantRecord, formatDateTime } from "../utils/quiz";

interface ResultsLocationState {
  participant: ParticipantDraft;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  askedQuestionIds: string[];
}

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsLocationState | undefined;
  const saveParticipant = useAppStore((store) => store.saveParticipant);
  const setLatestResult = useAppStore((store) => store.setLatestResult);
  const clearRun = useAppStore((store) => store.clearRun);
  const data = useAppStore((store) => store.data);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [countdown, setCountdown] = useState(6);

  const soundEnabled = data?.settings.soundEnabled ?? true;
  const rewardWheelOptions = data?.rewardWheelOptions ?? REWARD_WHEEL_OPTIONS;
  const gameModeMeta = getGameModeMeta(state?.participant.gameMode);
  const netCorrectCount = useMemo(
    () => calculateNetCorrect(state?.correctCount ?? 0, state?.wrongCount ?? 0),
    [state?.correctCount, state?.wrongCount]
  );
  const penaltyBlocks = useMemo(() => calculatePenaltyBlocks(state?.wrongCount ?? 0), [state?.wrongCount]);
  const qualifiesForReward = netCorrectCount >= REWARD_THRESHOLD;
  const successRate = useMemo(() => {
    if (!state?.totalAnswered) {
      return 0;
    }
    return Math.round((state.correctCount / state.totalAnswered) * 1000) / 10;
  }, [state]);

  useEffect(() => {
    if (!state || qualifiesForReward || finalResult) {
      return;
    }

    setFinalResult(`Odul hakki icin en az ${REWARD_THRESHOLD} net gerekiyor.`);
  }, [finalResult, qualifiesForReward, state]);

  useEffect(() => {
    if (!finalResult || !state || saved) {
      return;
    }

    const record = createParticipantRecord({
      id: state.participant.id,
      name: state.participant.name,
      photoDataUrl: state.participant.photoDataUrl,
      correctCount: state.correctCount,
      wrongCount: state.wrongCount,
      totalAnswered: state.totalAnswered,
      askedQuestionIds: state.askedQuestionIds,
      resultType: qualifiesForReward ? "reward" : "no-reward",
      resultLabel: finalResult,
      createdAt: state.participant.createdAt,
      gameMode: state.participant.gameMode
    });

    void saveParticipant(record).then(() => {
      setLatestResult(record);
      setSaved(true);
      if (qualifiesForReward) {
        playSoundEffect("reward", soundEnabled);
      }
    });
  }, [finalResult, qualifiesForReward, saveParticipant, saved, setLatestResult, soundEnabled, state]);

  useEffect(() => {
    if (!saved || !finalResult) {
      return;
    }

    setCountdown(6);
    const tickId = window.setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(tickId);
          clearRun();
          navigate("/");
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(tickId);
  }, [clearRun, finalResult, navigate, saved]);

  if (!state) {
    return <Navigate replace to="/" />;
  }

  function resolveWheelResult(result: SpinWheelResolution) {
    setFinalResult(result.label);
  }

  return (
    <AppFrame subtitle="Yarisma Sonucu">
      <section className="results-grid">
        <div className="feature-panel">
          <div className="eyebrow">{qualifiesForReward ? "Odul Carki" : "Sonuc Ozeti"}</div>
          <h2>{state.participant.name}</h2>
          <p className="helper-text">Oyun: {gameModeMeta.label}</p>
          <div className="result-summary-card">
            <img
              alt={state.participant.name}
              className="result-photo"
              src={state.participant.photoDataUrl || resolveAssetPath("/ui/image-fallback.svg")}
              onError={(event) => {
                event.currentTarget.src = resolveAssetPath("/ui/image-fallback.svg");
              }}
            />
            <div className="result-summary-stats">
              <span>Dogru: {state.correctCount}</span>
              <span>Yanlis: {state.wrongCount}</span>
              <span>Net: {netCorrectCount}</span>
              <span>4 Yanlis Kesintisi: {penaltyBlocks}</span>
              <span>Toplam: {state.totalAnswered}</span>
              <span>Basari: %{successRate}</span>
              <span>Tarih: {formatDateTime(state.participant.createdAt)}</span>
            </div>
          </div>
          <div className="score-rule-banner result-score-banner">
            Kural uygulandi: Her 4 yanlis 1 dogru dusurur. Odul carki icin gereken net skor: {REWARD_THRESHOLD}
          </div>
          <div className="final-result-banner">
            <strong>{qualifiesForReward ? "Odul Acildi" : "Odul Baraji Gecilemedi"}</strong>
            <h3>{finalResult ?? (qualifiesForReward ? "Cark sonucu bekleniyor..." : "Odul hakki hesaplanıyor...")}</h3>
            {!finalResult ? <p>Su anki net skor: {netCorrectCount}</p> : null}
            {saved ? <p className="return-note">{countdown} saniye sonra ana ekrana donuluyor.</p> : null}
          </div>
          <div className="cta-row">
            <button
              className="primary-button"
              disabled={!saved}
              onClick={() => {
                clearRun();
                navigate("/");
              }}
              type="button"
            >
              Ana Sayfaya Don
            </button>
            <button className="secondary-button" onClick={() => navigate(`/leaderboard?mode=${state.participant.gameMode}`)} type="button">
              Lider Tablosu
            </button>
          </div>
        </div>

        <div className="feature-panel wheel-panel">
          <div className="celebration-shell">
            {qualifiesForReward ? (
              <SpinWheel onResolved={resolveWheelResult} options={rewardWheelOptions} soundEnabled={soundEnabled} title="Odul Carki" />
            ) : (
              <div className="final-result-banner">
                <strong>Bu Turda Cark Yok</strong>
                <h3>{REWARD_THRESHOLD} net ve uzeri yapanlar odul carkini cevirir.</h3>
                <p>Senin net skorun: {netCorrectCount}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppFrame>
  );
}
