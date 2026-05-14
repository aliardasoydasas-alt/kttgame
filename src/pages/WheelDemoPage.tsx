import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppFrame } from "../components/AppFrame";
import { SpinWheel, type SpinWheelResolution } from "../components/SpinWheel";
import { REWARD_WHEEL_OPTIONS } from "../constants";
import { useAppStore } from "../store/app-store";

export function WheelDemoPage() {
  const navigate = useNavigate();
  const [wheelKey, setWheelKey] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const data = useAppStore((store) => store.data);
  const soundEnabled = data?.settings.soundEnabled ?? true;
  const rewardWheelOptions = data?.rewardWheelOptions ?? REWARD_WHEEL_OPTIONS;

  function resetWheel() {
    setResult(null);
    setWheelKey((current) => current + 1);
  }

  return (
    <AppFrame subtitle="Oyuna girmeden carki test et">
      <section className="results-grid">
        <div className="feature-panel">
          <div className="eyebrow">Cark Deneme Alani</div>
          <h2>Oyunu oynamadan once carki burada deneyebilirsin.</h2>
          <p>Bu alan artik sadece odul carkini test etmek icin kullanilir. Tekrar Cevir cikarsa cark burada da otomatik yeniden doner.</p>

          <div className="cta-row">
            <button className="secondary-button" onClick={() => resetWheel()} type="button">
              Yeniden Dene
            </button>
            <button className="ghost-button" onClick={() => navigate("/")} type="button">
              Ana Sayfaya Don
            </button>
          </div>

          <div className="final-result-banner">
            <strong>Son Gorulen Sonuc</strong>
            <h3>{result ?? "Henuz bir sonuc yok"}</h3>
          </div>
        </div>

        <div className="feature-panel wheel-panel">
          <div className="celebration-shell">
            <div className="wheel-demo-mode">Odul Carki</div>
            <div className="wheel-demo-note">
              Dilim sayilari orana gore tekrar edecek sekilde dagitildi: Figur, Magnet, Sticker gibi oduller birden
              fazla kez carkta yer alir.
            </div>
            <div key={`reward-${wheelKey}`}>
              <SpinWheel
                onResolved={(nextResult: SpinWheelResolution) => setResult(nextResult.label)}
                options={rewardWheelOptions}
                soundEnabled={soundEnabled}
                title="Odul Carki"
              />
            </div>
          </div>
        </div>
      </section>
    </AppFrame>
  );
}
