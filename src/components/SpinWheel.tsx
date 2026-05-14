import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { RewardOption } from "../types";
import { startLoopingSoundEffect, stopAudioPlayback } from "../utils/audio";

export interface SpinWheelResolution {
  chancePercent: number;
  label: string;
  tone: string;
}

interface SpinWheelProps {
  onResolved: (result: SpinWheelResolution) => void;
  options: RewardOption[];
  soundEnabled?: boolean;
  title: string;
}

interface LegendEntry {
  label: string;
  segmentCount: number;
  shortLabel: string;
  tone: string;
  weight: number;
}

interface WheelSlice extends RewardOption {
  centerAngle: number;
  endAngle: number;
  id: string;
  index: number;
  optionIndex: number;
  sliceWeight: number;
  startAngle: number;
}

interface CelebrationState {
  chancePercent: number;
  mode: "big-prize" | "resolved";
  text: string;
  tone: string;
}

const SVG_SIZE = 760;
const CENTER = SVG_SIZE / 2;
const OUTER_RADIUS = 320;
const INNER_RADIUS = 86;
const BADGE_RADIUS = 238;
const DEFAULT_TONE = "#fff6ee";
const POINTER_ANGLE = 270;
const REROLL_LABEL = "Tekrar Cevir";
const BIG_PRIZE_THRESHOLD = 5;
const CONFETTI_COLORS = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#f78c6b", "#ff9f1c"];

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

function polarToCartesian(radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad)
  };
}

function describeSlice(startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(OUTER_RADIUS, endAngle);
  const endOuter = polarToCartesian(OUTER_RADIUS, startAngle);
  const startInner = polarToCartesian(INNER_RADIUS, startAngle);
  const endInner = polarToCartesian(INNER_RADIUS, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
    "Z"
  ].join(" ");
}

function buildLegendEntries(options: RewardOption[]): LegendEntry[] {
  const grouped = new Map<string, LegendEntry>();

  for (const option of options) {
    const existing = grouped.get(option.label);
    if (existing) {
      existing.segmentCount += Math.max(1, option.segmentCount ?? 1);
      existing.weight += Math.max(0.1, option.weight);
      continue;
    }

    grouped.set(option.label, {
      label: option.label,
      shortLabel: option.shortLabel ?? option.label.slice(0, 3).toUpperCase(),
      segmentCount: Math.max(1, option.segmentCount ?? 1),
      tone: option.tone,
      weight: Math.max(0.1, option.weight)
    });
  }

  return Array.from(grouped.values());
}

function expandWheelSlices(options: RewardOption[]): WheelSlice[] {
  const buckets = options.map((option, optionIndex) => ({
    optionIndex,
    slices: Array.from({ length: Math.max(1, option.segmentCount ?? 1) }, (_, sliceIndex) => ({
      ...option,
      id: `${optionIndex}-${sliceIndex}`,
      optionIndex
    }))
  }));

  const arranged: Array<RewardOption & { id: string; optionIndex: number }> = [];
  let previousLabel = "";

  while (buckets.some((bucket) => bucket.slices.length > 0)) {
    const available = buckets
      .filter((bucket) => bucket.slices.length > 0)
      .sort((left, right) => right.slices.length - left.slices.length || left.optionIndex - right.optionIndex);

    const chosenBucket = available.find((bucket) => bucket.slices[0]?.label !== previousLabel) ?? available[0];
    const nextSlice = chosenBucket.slices.shift();
    if (!nextSlice) {
      break;
    }

    arranged.push(nextSlice);
    previousLabel = nextSlice.label;
  }

  const sliceAngle = 360 / arranged.length;
  return arranged.map((slice, index) => {
    const startAngle = index * sliceAngle;
    const endAngle = (index + 1) * sliceAngle;
    const sliceWeight = Math.max(0.1, slice.weight) / Math.max(1, slice.segmentCount ?? 1);
    return {
      ...slice,
      index,
      startAngle,
      endAngle,
      centerAngle: startAngle + sliceAngle / 2,
      sliceWeight
    };
  });
}

function isReroll(label: string) {
  return label.trim().toLocaleLowerCase("tr-TR") === REROLL_LABEL.toLocaleLowerCase("tr-TR");
}

function isRewardWheel(title: string) {
  return title.toLocaleLowerCase("tr-TR").includes("odul");
}

function resolveSliceAtPointer(slices: WheelSlice[], rotation: number) {
  const pointerPosition = normalizeAngle(POINTER_ANGLE - rotation);
  return (
    slices.find((slice) => pointerPosition >= slice.startAngle && pointerPosition < slice.endAngle) ??
    slices.find((slice) => pointerPosition === slice.endAngle) ??
    slices[0]
  );
}

function pickWeightedSlice(slices: WheelSlice[]) {
  const totalWeight = slices.reduce((sum, slice) => sum + slice.sliceWeight, 0);
  let cursor = Math.random() * totalWeight;

  for (const slice of slices) {
    cursor -= slice.sliceWeight;
    if (cursor <= 0) {
      return slice;
    }
  }

  return slices[slices.length - 1];
}

function calculateChancePercent(slices: WheelSlice[], label: string) {
  const totalWeight = slices.reduce((sum, slice) => sum + slice.sliceWeight, 0);
  if (totalWeight <= 0) {
    return 0;
  }

  const matchingWeight = slices
    .filter((slice) => slice.label === label)
    .reduce((sum, slice) => sum + slice.sliceWeight, 0);

  return Math.round((matchingWeight / totalWeight) * 1000) / 10;
}

export function SpinWheel({ onResolved, options, soundEnabled = true, title }: SpinWheelProps) {
  const slices = useMemo(() => expandWheelSlices(options), [options]);
  const legendEntries = useMemo(() => buildLegendEntries(options), [options]);
  const totalWeight = useMemo(() => legendEntries.reduce((sum, entry) => sum + entry.weight, 0), [legendEntries]);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedSliceId, setHighlightedSliceId] = useState<string | null>(null);
  const [displayLabel, setDisplayLabel] = useState<string | null>(null);
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [finalResolvedLabel, setFinalResolvedLabel] = useState<string | null>(null);
  const [resolvedTone, setResolvedTone] = useState<string>(DEFAULT_TONE);
  const [message, setMessage] = useState("Soldaki ok hangi dilimi gosteriyorsa sonuc odur.");
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const rotationRef = useRef(0);
  const settleTimeoutRef = useRef<number | null>(null);
  const rerollTimeoutRef = useRef<number | null>(null);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const wheelAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) {
        window.clearTimeout(settleTimeoutRef.current);
      }
      if (rerollTimeoutRef.current) {
        window.clearTimeout(rerollTimeoutRef.current);
      }
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
      stopAudioPlayback(wheelAudioRef.current);
    };
  }, []);

  function clearTimers() {
    if (settleTimeoutRef.current) {
      window.clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
    if (rerollTimeoutRef.current) {
      window.clearTimeout(rerollTimeoutRef.current);
      rerollTimeoutRef.current = null;
    }
    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = null;
    }
  }

  function startWheelSound() {
    if (wheelAudioRef.current || !soundEnabled) {
      return;
    }

    wheelAudioRef.current = startLoopingSoundEffect("wheel", soundEnabled);
  }

  function stopWheelSound() {
    stopAudioPlayback(wheelAudioRef.current);
    wheelAudioRef.current = null;
  }

  function revealResolvedResult(label: string, chancePercent: number, tone: string) {
    setCelebration({
      mode: "resolved",
      text: label,
      tone,
      chancePercent
    });
    setMessage(`SONUC: ${label}`);
    onResolved({
      label,
      chancePercent,
      tone
    });
  }

  function startSpin() {
    if (slices.length === 0) {
      return;
    }

    const selectedSlice = pickWeightedSlice(slices);
    const fullTurns = 7 + Math.random() * 2;
    const targetAngle = POINTER_ANGLE - selectedSlice.centerAngle;
    const normalizedCurrent = normalizeAngle(rotationRef.current);
    const normalizedDelta = normalizeAngle(targetAngle - normalizedCurrent);
    const nextRotation = rotationRef.current + fullTurns * 360 + normalizedDelta;

    startWheelSound();
    rotationRef.current = nextRotation % 360;
    setRotation(nextRotation);
    setHighlightedSliceId(null);
    setDisplayLabel(null);
    setDisplayCode(null);
    setResolvedTone(DEFAULT_TONE);
    setFinalResolvedLabel(null);
    setCelebration(null);
    setIsSpinning(true);
    setMessage(`${title} donuyor...`);

    settleTimeoutRef.current = window.setTimeout(() => {
      settleTimeoutRef.current = null;
      stopWheelSound();

      const resolvedSlice = resolveSliceAtPointer(slices, nextRotation) ?? selectedSlice;
      setIsSpinning(false);
      setHighlightedSliceId(resolvedSlice.id);
      setDisplayLabel(resolvedSlice.label);
      setDisplayCode(resolvedSlice.shortLabel ?? resolvedSlice.label.slice(0, 3).toUpperCase());
      setResolvedTone(resolvedSlice.tone);

      if (isReroll(resolvedSlice.label)) {
        setMessage("Tekrar Cevir geldi. Cark yeniden donuyor...");
        rerollTimeoutRef.current = window.setTimeout(() => {
          rerollTimeoutRef.current = null;
          startSpin();
        }, 1100);
        return;
      }

      const chancePercent = calculateChancePercent(slices, resolvedSlice.label);
      const bigPrize = isRewardWheel(title) && chancePercent < BIG_PRIZE_THRESHOLD;
      setFinalResolvedLabel(resolvedSlice.label);

      if (bigPrize) {
        setCelebration({
          mode: "big-prize",
          text: "BUYUK ODUL!",
          tone: "#ffd166",
          chancePercent
        });
        setMessage("BUYUK ODUL yakalandi!");

        celebrationTimeoutRef.current = window.setTimeout(() => {
          celebrationTimeoutRef.current = null;
          revealResolvedResult(resolvedSlice.label, chancePercent, resolvedSlice.tone);
        }, 1300);
        return;
      }

      revealResolvedResult(resolvedSlice.label, chancePercent, resolvedSlice.tone);
    }, 4200);
  }

  function handleSpin() {
    if (isSpinning || finalResolvedLabel) {
      return;
    }

    clearTimers();
    startSpin();
  }

  function handleWheelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleSpin();
  }

  const celebrationStyle = useMemo(
    () =>
      ({
        "--wheel-celebration-tone": celebration?.tone ?? DEFAULT_TONE
      }) as CSSProperties,
    [celebration?.tone]
  );

  return (
    <section className="wheel-section">
      <div
        aria-disabled={isSpinning || !!finalResolvedLabel}
        aria-label={finalResolvedLabel ? "Cark sonucu kesinlesti" : "Carka dokunarak dondur"}
        className={`wheel-stage wheel-stage-interactive ${isSpinning || finalResolvedLabel ? "disabled" : ""}`}
        onClick={handleSpin}
        onKeyDown={handleWheelKeyDown}
        role="button"
        tabIndex={isSpinning || finalResolvedLabel ? -1 : 0}
      >
        <div className="wheel-side-pointer" />
        <div className="wheel-svg-shell">
          <svg className="wheel-svg" style={{ transform: `rotate(${rotation}deg)` }} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
            <defs>
              <filter id="wheelShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="22" stdDeviation="14" floodColor="rgba(0,0,0,0.34)" />
              </filter>
              <filter id="winnerGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="rgba(255,239,170,0.9)" />
              </filter>
            </defs>

            <circle cx={CENTER} cy={CENTER} fill="#fff8ef" r={OUTER_RADIUS + 22} />
            <circle cx={CENTER} cy={CENTER} fill="#efc98d" r={OUTER_RADIUS + 10} />
            <circle cx={CENTER} cy={CENTER} fill="#fdf4e6" r={OUTER_RADIUS + 2} />

            <g filter="url(#wheelShadow)">
              {slices.map((slice) => (
                <path
                  d={describeSlice(slice.startAngle, slice.endAngle)}
                  fill={slice.tone}
                  key={slice.id}
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="4"
                />
              ))}
              {slices.map((slice) => (
                <line
                  key={`divider-${slice.id}`}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="3"
                  x1={CENTER}
                  x2={polarToCartesian(OUTER_RADIUS, slice.startAngle).x}
                  y1={CENTER}
                  y2={polarToCartesian(OUTER_RADIUS, slice.startAngle).y}
                />
              ))}
              {highlightedSliceId
                ? slices
                    .filter((slice) => slice.id === highlightedSliceId)
                    .map((slice) => (
                      <path
                        d={describeSlice(slice.startAngle, slice.endAngle)}
                        fill="none"
                        filter="url(#winnerGlow)"
                        key={`highlight-${slice.id}`}
                        stroke="#fff2a8"
                        strokeWidth="12"
                      />
                    ))
                : null}
            </g>

            {slices.map((slice) => {
              const badge = polarToCartesian(BADGE_RADIUS, slice.centerAngle);
              const flip = slice.centerAngle > 180;
              const shortLabel = slice.shortLabel ?? slice.label.slice(0, 3).toUpperCase();
              return (
                <g key={`badge-${slice.id}`} transform={`rotate(${slice.centerAngle} ${badge.x} ${badge.y})`}>
                  <g transform={flip ? `translate(${badge.x} ${badge.y}) rotate(180)` : `translate(${badge.x} ${badge.y})`}>
                    <rect
                      className={`wheel-slice-badge ${highlightedSliceId === slice.id ? "winner" : ""}`}
                      fill="rgba(255,255,255,0.96)"
                      height="34"
                      rx="12"
                      stroke="rgba(91,27,34,0.24)"
                      strokeWidth="2"
                      width="54"
                      x="-27"
                      y="-17"
                    />
                    <text className="wheel-slice-code" fill="#240808" textAnchor="middle" x="0" y="6">
                      {shortLabel}
                    </text>
                  </g>
                </g>
              );
            })}

            <circle cx={CENTER} cy={CENTER} fill="#fff7ed" r={INNER_RADIUS + 22} stroke="#d0a664" strokeWidth="10" />
            <circle cx={CENTER} cy={CENTER} fill="#7e1320" r={INNER_RADIUS - 4} />
            <text className="wheel-svg-center" fill="#fff4d6" textAnchor="middle" x={CENTER} y={CENTER - 8}>
              {displayCode ?? "SPIN"}
            </text>
            <text className="wheel-svg-center-sub" fill="#ffd89c" textAnchor="middle" x={CENTER} y={CENTER + 18}>
              {title}
            </text>
          </svg>
        </div>

        {celebration ? (
          <div className="wheel-celebration" style={celebrationStyle}>
            <div className={`wheel-celebration-card ${celebration.mode}`}>
              <span className="wheel-celebration-kicker">
                {celebration.mode === "big-prize" ? "NADIR SONUC" : "KESIN SONUC"}
              </span>
              <strong>{celebration.text}</strong>
              <span className="wheel-celebration-meta">Sans orani: %{celebration.chancePercent}</span>
            </div>
            <div className="confetti-layer confetti-layer-wheel" aria-hidden="true">
              {Array.from({ length: 30 }, (_, index) => {
                const style: CSSProperties = {
                  left: `${(index % 10) * 9 + (index % 3) * 2}%`,
                  animationDelay: `${(index % 6) * 0.08}s`,
                  background: CONFETTI_COLORS[index % CONFETTI_COLORS.length]
                };

                return <span className="confetti-piece" key={`wheel-confetti-${index}`} style={style} />;
              })}
            </div>
          </div>
        ) : null}

        {!isSpinning && !finalResolvedLabel ? <div className="wheel-touch-hint">Carka dokun</div> : null}
      </div>

      <div className="wheel-result">
        <div className="eyebrow">{title}</div>
        <h3>{message}</h3>
        <div className={`wheel-final-pill ${finalResolvedLabel ? "resolved" : ""}`} style={{ borderColor: resolvedTone, color: resolvedTone }}>
          {displayLabel ?? "Spin bekleniyor"}
        </div>
        <div className="wheel-legend">
          {legendEntries.map((entry) => (
            <div className="wheel-legend-row" key={entry.label}>
              <span className="wheel-legend-code" style={{ background: entry.tone }}>
                {entry.shortLabel}
              </span>
              <strong>{entry.label}</strong>
              <span>
                %{totalWeight > 0 ? Math.round((entry.weight / totalWeight) * 1000) / 10 : 0} | x{entry.segmentCount}
              </span>
            </div>
          ))}
        </div>
        <p className="wheel-result-note">Carka dokunarak cevir. Tekrar Cevir cikarsa cark otomatik olarak yeniden doner ve ilk kesin sonuc kaydedilir.</p>
      </div>
    </section>
  );
}
