import type { PropsWithChildren, ReactNode } from "react";
import { APP_SUBTITLE, APP_TITLE } from "../constants";
import { useAppStore } from "../store/app-store";

interface AppFrameProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: "default" | "home";
}

export function AppFrame({ title = APP_TITLE, subtitle = APP_SUBTITLE, actions, children, variant = "default" }: AppFrameProps) {
  const fullscreen = useAppStore((state) => state.fullscreen);
  const setFullscreen = useAppStore((state) => state.setFullscreen);
  const data = useAppStore((state) => state.data);

  return (
    <div className={`app-shell ${variant === "home" ? "home-shell" : ""}`}>
      <header className={`hero-bar ${variant === "home" ? "hero-bar-home" : ""}`}>
        <div aria-hidden="true" className="hero-side" />
        <div aria-label={title} className={`brand-lockup ${variant === "home" ? "brand-lockup-home" : ""}`} data-page-context={subtitle}>
          {variant === "home" ? (
            <strong className="brand-lockup-home-text">
              <span className="brand-ink-dark">KULTUR VE</span>
              <span className="brand-ink-red"> TURIZM TOPLULUGU</span>
            </strong>
          ) : (
            <strong className="brand-lockup-text">Kultur ve Turizm Toplulugu</strong>
          )}
        </div>
        <div className={`hero-actions ${variant === "home" ? "hero-actions-home" : ""}`}>
          <button className="ghost-button" onClick={() => void setFullscreen(!fullscreen)} type="button">
            {fullscreen ? "Pencere" : "Tam Ekran"}
          </button>
          <button
            className={`sound-toggle ${data?.settings.soundEnabled ? "enabled" : ""}`}
            onClick={() =>
              void useAppStore.getState().saveSettings({
                ...(data?.settings ?? { adminPassword: "1234", soundEnabled: true }),
                soundEnabled: !(data?.settings.soundEnabled ?? true)
              })
            }
            type="button"
          >
            Ses {data?.settings.soundEnabled ? "Acik" : "Kapali"}
          </button>
          {actions}
        </div>
      </header>
      <main aria-label={title} className={`app-content ${variant === "home" ? "app-content-home" : ""}`} data-page-context={subtitle}>
        {children}
      </main>
    </div>
  );
}
