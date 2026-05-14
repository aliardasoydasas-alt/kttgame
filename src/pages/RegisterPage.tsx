import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppFrame } from "../components/AppFrame";
import { useAppStore } from "../store/app-store";
import { getGameModeMeta, normalizeGameMode } from "../utils/game-mode";

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setParticipantDraft = useAppStore((state) => state.setParticipantDraft);
  const startQuizRun = useAppStore((state) => state.startQuizRun);
  const showToast = useAppStore((state) => state.showToast);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [name, setName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [cameraState, setCameraState] = useState<"loading" | "ready" | "unavailable">("loading");
  const gameMode = normalizeGameMode(searchParams.get("mode"));
  const gameModeMeta = getGameModeMeta(gameMode);

  useEffect(() => {
    let mounted = true;

    async function connectCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraStream(stream);
        setCameraState("ready");
      } catch {
        setCameraState("unavailable");
      }
    }

    void connectCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cameraStream) {
      return;
    }

    video.srcObject = cameraStream;
    video.muted = true;
    video.playsInline = true;

    void video.play().catch(() => undefined);

    return () => {
      if (video.srcObject === cameraStream) {
        video.srcObject = null;
      }
    };
  }, [cameraStream]);

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.9));
    showToast("Fotograf kaydedildi.", "success");
  }

  function proceedToQuiz() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast("Yarismaci adi girmeden ilerlenemez.", "error");
      return;
    }

    const createdAt = new Date().toISOString();
    setParticipantDraft({
      id: crypto.randomUUID(),
      name: trimmedName,
      photoDataUrl,
      createdAt,
      gameMode
    });
    if (startQuizRun()) {
      navigate("/quiz");
    }
  }

  return (
    <AppFrame subtitle={gameModeMeta.label}>
      <section className="register-grid">
        <div className="feature-panel">
          <div className="eyebrow">1. Adim</div>
          <h2>Yarismaci kaydini tamamla</h2>
          <p className="helper-text">Secilen oyun: {gameModeMeta.label}</p>
          <label className="input-label" htmlFor="participant-name">
            Yarismaci Adi
          </label>
          <input
            className="text-input"
            id="participant-name"
            maxLength={50}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ad Soyad"
            value={name}
          />
          <p className="helper-text">Kamera calismasa bile fotografsiz devam edebilirsin.</p>
          <div className="cta-row">
            <button className="primary-button" onClick={proceedToQuiz} type="button">
              Yarismaya Basla
            </button>
            <button className="ghost-button" onClick={() => navigate("/")} type="button">
              Ana Sayfaya Don
            </button>
          </div>
        </div>

        <div className="feature-panel camera-panel">
          <div className="eyebrow">2. Adim</div>
          <h2>Kamera ve Fotograf</h2>
          <div className={`camera-frame ${cameraState}`}>
            {cameraState === "ready" ? <video autoPlay className="camera-video" muted playsInline ref={videoRef} /> : null}
            {cameraState !== "ready" ? (
              <div className="camera-placeholder">
                {cameraState === "loading" ? "Kamera hazirlaniyor..." : "Kamera kullanilamiyor. Fotografsiz devam edebilirsin."}
              </div>
            ) : null}
            {photoDataUrl ? <img alt="Cekilen fotograf" className="captured-photo" src={photoDataUrl} /> : null}
          </div>
          <div className="cta-row">
            <button className="secondary-button" disabled={cameraState !== "ready"} onClick={capturePhoto} type="button">
              Fotograf Cek
            </button>
            <button className="ghost-button" onClick={() => setPhotoDataUrl(undefined)} type="button">
              Fotografi Temizle
            </button>
          </div>
          <canvas hidden ref={canvasRef} />
        </div>
      </section>
    </AppFrame>
  );
}
