import { useNavigate } from "react-router-dom";
import { AppFrame } from "../components/AppFrame";
import { GAME_MODE_META } from "../constants";
import { EVENT_CARDS } from "../constants";
import { useAppStore } from "../store/app-store";
import { resolveAssetPath } from "../utils/assets";

export function HomePage() {
  const navigate = useNavigate();
  const eventCards = useAppStore((state) => state.data?.eventCards ?? EVENT_CARDS);

  return (
    <AppFrame subtitle="Ana Sayfa" variant="home">
      <section className="home-moodboard">
        <div aria-hidden="true" className="home-doodle home-doodle-plane">
          ✈
        </div>
        <div aria-hidden="true" className="home-doodle home-doodle-heart">
          ❤
        </div>
        <div aria-hidden="true" className="home-doodle home-doodle-camera">
          📷
        </div>
        <div aria-hidden="true" className="home-doodle home-doodle-sign">
          ↔
        </div>

        <section className="home-note-column">
          <div className="home-note-surface">
            <div className="home-game-note-stack">
              <button className="home-sticky-note primary" onClick={() => navigate("/register?mode=landmark")} type="button">
                <span className="home-sticky-game-title">{GAME_MODE_META.landmark.homeTitle}</span>
                <span className="home-sticky-line home-sticky-line-dark">OYNAMAK</span>
                <span className="home-sticky-line home-sticky-line-red">ICIN BAS</span>
                <span className="home-sticky-subcopy">{GAME_MODE_META.landmark.homeSubtitle}</span>
              </button>

              <button className="home-sticky-note secondary" onClick={() => navigate("/register?mode=country-map")} type="button">
                <span className="home-sticky-game-title">{GAME_MODE_META["country-map"].homeTitle}</span>
                <span className="home-sticky-line home-sticky-line-dark">HARITAYI</span>
                <span className="home-sticky-line home-sticky-line-red">BIL</span>
                <span className="home-sticky-subcopy">{GAME_MODE_META["country-map"].homeSubtitle}</span>
              </button>
            </div>
          </div>

          <div className="home-bottom-actions">
            <button className="home-tag-button" onClick={() => navigate("/admin")} type="button">
              Yonetici Paneli
            </button>
            <button className="home-tag-button accent" onClick={() => navigate("/wheel-demo")} type="button">
              Oyunsuz Cark
            </button>
          </div>
        </section>

        <section className="home-board-column">
          <div className="home-board-heading">Etkinlikler</div>
          <div className="event-board-grid home-polaroid-grid">
            {eventCards.map((eventItem) => (
              <article className="event-photo-card" key={eventItem.id}>
                <div className="event-photo-frame">
                  <img alt={eventItem.title} className="event-photo-image" src={resolveAssetPath(eventItem.image)} />
                </div>
                <div className="event-photo-caption">{eventItem.title}</div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AppFrame>
  );
}
