import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AppFrame } from "../components/AppFrame";
import { QuestionCard } from "../components/QuestionCard";
import { QUIZ_DURATION_SECONDS } from "../constants";
import { useAppStore } from "../store/app-store";
import { playSoundEffect } from "../utils/audio";
import { getGameModeMeta } from "../utils/game-mode";
import { calculateNetCorrect, calculatePenaltyBlocks } from "../utils/quiz";

export function QuizPage() {
  const navigate = useNavigate();
  const currentRun = useAppStore((state) => state.currentRun);
  const data = useAppStore((state) => state.data);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [askedQuestionIds, setAskedQuestionIds] = useState<string[]>([]);

  const activeRun = currentRun;
  const question = activeRun?.questionOrder[questionIndex];
  const soundEnabled = data?.settings.soundEnabled ?? true;
  const penaltyBlocks = calculatePenaltyBlocks(wrongCount);
  const netCorrectCount = calculateNetCorrect(correctCount, wrongCount);
  const gameModeMeta = getGameModeMeta(activeRun?.gameMode);

  useEffect(() => {
    if (!currentRun) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timerId);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [currentRun]);

  useEffect(() => {
    if (timeLeft === 0 && activeRun) {
      navigate("/results", {
        replace: true,
        state: {
          participant: activeRun.participant,
          correctCount,
          wrongCount,
          totalAnswered: correctCount + wrongCount,
          askedQuestionIds
        }
      });
    }
  }, [activeRun, askedQuestionIds, correctCount, navigate, timeLeft, wrongCount]);

  const progressValue = useMemo(() => ((QUIZ_DURATION_SECONDS - timeLeft) / QUIZ_DURATION_SECONDS) * 100, [timeLeft]);

  if (!activeRun) {
    return <Navigate replace to="/register" />;
  }

  if (!question) {
    return (
      <Navigate
        replace
        state={{ participant: activeRun.participant, correctCount, wrongCount, totalAnswered: correctCount + wrongCount, askedQuestionIds }}
        to="/results"
      />
    );
  }

  function nextQuestion() {
    setSelectedAnswer(null);
    setLocked(false);
    setQuestionIndex((previous) => previous + 1);
  }

  function handleAnswer(answer: string) {
    if (locked) {
      return;
    }

    const activeQuestion = question!;
    const runSnapshot = activeRun!;
    const nextAskedQuestionIds = [...askedQuestionIds, activeQuestion.id];
    const isCorrect = answer === activeQuestion.correctAnswer;
    setLocked(true);
    setSelectedAnswer(answer);
    setAskedQuestionIds(nextAskedQuestionIds);

    if (isCorrect) {
      setCorrectCount((previous) => previous + 1);
      playSoundEffect("correct", soundEnabled);
    } else {
      setWrongCount((previous) => previous + 1);
      playSoundEffect("wrong", soundEnabled);
    }

    window.setTimeout(() => {
      if (timeLeft <= 1) {
        navigate("/results", {
          replace: true,
          state: {
            participant: runSnapshot.participant,
            correctCount: isCorrect ? correctCount + 1 : correctCount,
            wrongCount: isCorrect ? wrongCount : wrongCount + 1,
            totalAnswered: correctCount + wrongCount + 1,
            askedQuestionIds: nextAskedQuestionIds
          }
        });
        return;
      }

      nextQuestion();
    }, 900);
  }

  return (
    <AppFrame subtitle={gameModeMeta.label}>
      <section className={`quiz-layout ${selectedAnswer ? (selectedAnswer === question.correctAnswer ? "flash-success" : "flash-error") : ""}`}>
        <div className="quiz-topbar">
          <div className="timer-panel">
            <span>Kalan Sure</span>
            <strong>{timeLeft} sn</strong>
            <div className="progress-bar">
              <span style={{ width: `${progressValue}%` }} />
            </div>
          </div>
          <div className="inline-stats">
            <article className="stat-card">
              <span>Dogru</span>
              <strong>{correctCount}</strong>
            </article>
            <article className="stat-card">
              <span>Yanlis</span>
              <strong>{wrongCount}</strong>
            </article>
            <article className="stat-card">
              <span>Net</span>
              <strong>{netCorrectCount}</strong>
            </article>
            <article className="stat-card">
              <span>Soru</span>
              <strong>
                {questionIndex + 1}/{activeRun.questionOrder.length}
              </strong>
            </article>
          </div>
        </div>
        <div className="score-rule-banner">Kural: Her 4 yanlis 1 dogruyu goturur. Su an 4 yanlis kesintisi: {penaltyBlocks}</div>
        <QuestionCard locked={locked} onAnswer={handleAnswer} question={question} selectedAnswer={selectedAnswer} />
        {locked && selectedAnswer !== question.correctAnswer ? <div className="feedback-strip">Dogru cevap: {question.correctAnswer}</div> : null}
      </section>
    </AppFrame>
  );
}
