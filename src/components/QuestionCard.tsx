import { useState } from "react";
import type { QuestionItem } from "../types";
import { resolveAssetPath, resolveQuestionImagePath } from "../utils/assets";

interface QuestionCardProps {
  question: QuestionItem;
  locked: boolean;
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}

export function QuestionCard({ question, locked, selectedAnswer, onAnswer }: QuestionCardProps) {
  const [imageErrored, setImageErrored] = useState(false);

  return (
    <section className="question-card">
      <div className="question-image-panel">
        <img
          alt={question.questionText}
          className="question-image"
          src={imageErrored ? resolveAssetPath("/ui/image-fallback.svg") : resolveQuestionImagePath(question.image)}
          onError={() => setImageErrored(true)}
        />
      </div>
      <div className="question-copy">
        <h2>{question.questionText}</h2>
        <div className="options-grid">
          {question.options.map((option) => {
            const isCorrect = option === question.correctAnswer;
            const isSelected = selectedAnswer === option;
            const statusClass =
              !selectedAnswer || !locked
                ? ""
                : isCorrect
                  ? "correct"
                  : isSelected
                    ? "wrong"
                    : "";

            return (
              <button
                className={`answer-button ${statusClass}`}
                disabled={locked}
                key={option}
                onClick={() => onAnswer(option)}
                type="button"
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
