import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppFrame } from "../components/AppFrame";
import { GAME_MODE_META } from "../constants";
import { useAppStore } from "../store/app-store";
import type { EventCardItem, GameMode, ParticipantRecord, QuestionItem, RewardOption } from "../types";
import { getQuestionGameMode } from "../utils/game-mode";
import { resolveAssetPath, resolveQuestionImagePath } from "../utils/assets";

type AdminTab = "participants" | "questions" | "events" | "wheels";
type QuestionModeFilter = GameMode | "all";

function calculateAccuracy(correctCount: number, wrongCount: number) {
  const totalAnswered = correctCount + wrongCount;
  if (totalAnswered === 0) {
    return 0;
  }

  return Math.round((correctCount / totalAnswered) * 1000) / 10;
}

function createEmptyQuestion(): QuestionItem {
  return {
    id: crypto.randomUUID(),
    image: "/ui/image-fallback.svg",
    questionText: "Bu gorselde one cikan turistik yer hangisidir?",
    options: ["", "", "", ""],
    correctAnswer: "",
    city: "",
    country: "",
    difficulty: "medium",
    gameMode: "landmark"
  };
}

function createWheelOption(): RewardOption {
  return {
    id: `reward-${crypto.randomUUID()}`,
    label: "Yeni Odul",
    shortLabel: "YEN",
    weight: 10,
    segmentCount: 1,
    tone: "#ff9f1c"
  };
}

function createEventCard(): EventCardItem {
  return {
    id: `event-${crypto.randomUUID()}`,
    title: "Yeni Etkinlik",
    image: "/ui/image-fallback.svg"
  };
}

function cloneWheelOptions(options: RewardOption[]) {
  return options.map((option) => ({ ...option }));
}

function cloneEventCards(eventCards: EventCardItem[]) {
  return eventCards.map((eventCard) => ({ ...eventCard }));
}

function totalWheelWeight(options: RewardOption[]) {
  return options.reduce((sum, option) => sum + Math.max(0, Number(option.weight) || 0), 0);
}

function updateWheelOption(options: RewardOption[], optionId: string, patch: Partial<RewardOption>) {
  return options.map((option) => (option.id === optionId ? { ...option, ...patch } : option));
}

function updateEventCard(eventCards: EventCardItem[], eventCardId: string, patch: Partial<EventCardItem>) {
  return eventCards.map((eventCard) => (eventCard.id === eventCardId ? { ...eventCard, ...patch } : eventCard));
}

function sanitizeWheelOptions(options: RewardOption[]) {
  return options
    .map((option, index) => ({
      ...option,
      id: option.id || `wheel-${index + 1}`,
      label: option.label.trim(),
      shortLabel: (option.shortLabel?.trim() || option.label.trim().slice(0, 3)).toUpperCase(),
      weight: Math.max(0.1, Number(option.weight) || 0),
      segmentCount: Math.max(1, Math.round(Number(option.segmentCount) || 1)),
      tone: option.tone || "#ff9f1c"
    }))
    .filter((option) => option.label);
}

function sanitizeEventCards(eventCards: EventCardItem[]) {
  return eventCards
    .map((eventCard, index) => ({
      id: eventCard.id || `event-${index + 1}`,
      title: eventCard.title.trim(),
      image: eventCard.image.trim()
    }))
    .filter((eventCard) => eventCard.title && eventCard.image);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("file-read-error"));
    reader.readAsDataURL(file);
  });
}

function ParticipantEditor({
  onSave,
  participant
}: {
  onSave: (participant: ParticipantRecord) => Promise<void>;
  participant: ParticipantRecord;
}) {
  const [draft, setDraft] = useState(participant);

  useEffect(() => {
    setDraft(participant);
  }, [participant]);

  return (
    <div className="admin-card">
      <div className="inline-form four">
        <input className="text-input slim" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <input
          className="text-input slim"
          min={0}
          type="number"
          value={draft.correctCount}
          onChange={(event) => setDraft({ ...draft, correctCount: Math.max(0, Number(event.target.value)) })}
        />
        <input
          className="text-input slim"
          min={0}
          type="number"
          value={draft.wrongCount}
          onChange={(event) => setDraft({ ...draft, wrongCount: Math.max(0, Number(event.target.value)) })}
        />
        <input
          className="text-input slim"
          value={draft.resultLabel}
          onChange={(event) => setDraft({ ...draft, resultLabel: event.target.value })}
        />
      </div>
      <div className="cta-row">
        <button
          className="secondary-button"
          onClick={() =>
            void onSave({
              ...draft,
              totalAnswered: draft.correctCount + draft.wrongCount,
              accuracyRate: calculateAccuracy(draft.correctCount, draft.wrongCount),
              updatedAt: new Date().toISOString()
            })
          }
          type="button"
        >
          Katilimciyi Guncelle
        </button>
      </div>
    </div>
  );
}

function WheelEditorSection({
  addLabel,
  description,
  onAdd,
  onChange,
  onRemove,
  onSave,
  options,
  title
}: {
  addLabel: string;
  description: string;
  onAdd: () => void;
  onChange: (optionId: string, patch: Partial<RewardOption>) => void;
  onRemove: (optionId: string) => void;
  onSave: () => void;
  options: RewardOption[];
  title: string;
}) {
  const totalWeight = useMemo(() => totalWheelWeight(options), [options]);

  return (
    <div className="feature-panel">
      <div className="section-header">
        <div>
          <div className="eyebrow">Cark Ayarlari</div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="cta-row">
          <button className="ghost-button" onClick={onAdd} type="button">
            {addLabel}
          </button>
          <button className="secondary-button" onClick={onSave} type="button">
            Carki Kaydet
          </button>
        </div>
      </div>

      <div className="wheel-admin-note">
        Sans yuzdesi gercek sonucu belirler. Dilim sayisi sadece ayni odulun carkta kac kez gorunecegini ayarlar.
      </div>

      <div className="wheel-admin-table">
        <div className="wheel-admin-row wheel-admin-row-header">
          <span>Etiket</span>
          <span>Kisa Kod</span>
          <span>Sans %</span>
          <span>Dilim</span>
          <span>Renk</span>
          <span>Pay</span>
          <span>Sil</span>
        </div>

        {options.map((option) => {
          const normalizedShare = totalWeight > 0 ? Math.round((Math.max(0, option.weight) / totalWeight) * 1000) / 10 : 0;
          return (
            <div className="wheel-admin-row" key={option.id}>
              <input className="text-input slim" value={option.label} onChange={(event) => onChange(option.id, { label: event.target.value })} />
              <input
                className="text-input slim"
                maxLength={5}
                value={option.shortLabel ?? ""}
                onChange={(event) => onChange(option.id, { shortLabel: event.target.value.toUpperCase() })}
              />
              <input
                className="text-input slim"
                min={0.1}
                step={0.1}
                type="number"
                value={option.weight}
                onChange={(event) => onChange(option.id, { weight: Number(event.target.value) })}
              />
              <input
                className="text-input slim"
                min={1}
                step={1}
                type="number"
                value={option.segmentCount ?? 1}
                onChange={(event) => onChange(option.id, { segmentCount: Number(event.target.value) })}
              />
              <div className="wheel-color-cell">
                <input className="wheel-color-input" type="color" value={option.tone} onChange={(event) => onChange(option.id, { tone: event.target.value })} />
                <span>{option.tone}</span>
              </div>
              <strong>%{normalizedShare}</strong>
              <button className="danger-button wheel-remove-button" onClick={() => onRemove(option.id)} type="button">
                Sil
              </button>
            </div>
          );
        })}
      </div>

      <div className="wheel-admin-summary">
        <strong>Toplam girilen sans: %{Math.round(totalWeight * 10) / 10}</strong>
        <span>Toplamin 100 olmasi tavsiye edilir ama zorunlu degil. Uygulama oranlari otomatik normalize eder.</span>
      </div>
    </div>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const data = useAppStore((state) => state.data);
  const adminAuthenticated = useAppStore((state) => state.adminAuthenticated);
  const loginAdmin = useAppStore((state) => state.loginAdmin);
  const logoutAdmin = useAppStore((state) => state.logoutAdmin);
  const updateParticipant = useAppStore((state) => state.updateParticipant);
  const deleteParticipant = useAppStore((state) => state.deleteParticipant);
  const resetParticipants = useAppStore((state) => state.resetParticipants);
  const saveQuestion = useAppStore((state) => state.saveQuestion);
  const deleteQuestion = useAppStore((state) => state.deleteQuestion);
  const saveEventCards = useAppStore((state) => state.saveEventCards);
  const saveWheelOptions = useAppStore((state) => state.saveWheelOptions);
  const exportJson = useAppStore((state) => state.exportJson);
  const exportCsv = useAppStore((state) => state.exportCsv);
  const importJson = useAppStore((state) => state.importJson);
  const showToast = useAppStore((state) => state.showToast);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("questions");
  const [questionDraft, setQuestionDraft] = useState<QuestionItem>(createEmptyQuestion());
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionModeFilter, setQuestionModeFilter] = useState<QuestionModeFilter>("all");
  const [rewardWheelDraft, setRewardWheelDraft] = useState<RewardOption[]>([]);
  const [eventCardDrafts, setEventCardDrafts] = useState<EventCardItem[]>([]);

  useEffect(() => {
    setRewardWheelDraft(cloneWheelOptions(data?.rewardWheelOptions ?? []));
    setEventCardDrafts(cloneEventCards(data?.eventCards ?? []));
  }, [data?.rewardWheelOptions, data?.eventCards]);

  const visibleQuestions = useMemo(() => {
    const query = questionSearch.trim().toLocaleLowerCase("tr-TR");
    if (!query) {
      return (data?.questions ?? []).filter(
        (question) => questionModeFilter === "all" || getQuestionGameMode(question) === questionModeFilter
      );
    }

    return (data?.questions ?? []).filter((question) => {
      const modeMatches = questionModeFilter === "all" || getQuestionGameMode(question) === questionModeFilter;
      if (!modeMatches) {
        return false;
      }

      return [question.correctAnswer, question.city, question.country, question.questionText, GAME_MODE_META[getQuestionGameMode(question)].label].some(
        (value) => value.toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [data?.questions, questionModeFilter, questionSearch]);

  async function handleSaveRewardWheel() {
    const prepared = sanitizeWheelOptions(rewardWheelDraft);
    if (!prepared.length) {
      showToast("Odul carki icin en az bir gecerli secenek gerekir.", "error");
      return;
    }

    await saveWheelOptions({ rewardWheelOptions: prepared });
    showToast("Odul carki ayarlari kaydedildi.", "success");
  }

  async function handleSaveEventCards() {
    const prepared = sanitizeEventCards(eventCardDrafts);
    if (!prepared.length) {
      showToast("Etkinlik panosu icin en az bir kart gerekir.", "error");
      return;
    }

    await saveEventCards(prepared);
    showToast("Etkinlik panosu guncellendi.", "success");
  }

  async function handleEventImageUpload(eventCardId: string, file: File | null) {
    if (!file) {
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      setEventCardDrafts((current) => updateEventCard(current, eventCardId, { image: imageDataUrl }));
      showToast("Fotograf secildi. Kaydet butonuna basarak panoya uygula.", "info");
    } catch {
      showToast("Fotograf yuklenemedi.", "error");
    }
  }

  if (!adminAuthenticated) {
    return (
      <AppFrame subtitle="Yonetici Girisi">
        <section className="feature-panel admin-login">
          <div className="eyebrow">Sifreli Erisim</div>
          <h2>Yonetici paneli icin sifre girin</h2>
          <input
            className="text-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Varsayilan sifre: 1234"
            type="password"
            value={password}
          />
          <div className="cta-row">
            <button
              className="primary-button"
              onClick={() => {
                if (!loginAdmin(password)) {
                  showToast("Sifre hatali.", "error");
                  return;
                }

                showToast("Yonetici paneli acildi.", "success");
              }}
              type="button"
            >
              Giris Yap
            </button>
            <button className="ghost-button" onClick={() => navigate("/")} type="button">
              Ana Sayfaya Don
            </button>
          </div>
        </section>
      </AppFrame>
    );
  }

  return (
    <AppFrame subtitle="Yonetici Paneli">
      <section className="admin-shell">
        <aside className="feature-panel admin-rail">
          <div>
            <div className="eyebrow">Kontrol Merkezi</div>
            <h2>Yonetim</h2>
            <p>Uzun liste yerine buradan bolum secerek hizli duzenleme yap.</p>
          </div>

          <div className="admin-nav-list">
            <button className={`admin-nav-button ${activeTab === "questions" ? "active" : ""}`} onClick={() => setActiveTab("questions")} type="button">
              Sorular
            </button>
            <button className={`admin-nav-button ${activeTab === "events" ? "active" : ""}`} onClick={() => setActiveTab("events")} type="button">
              Etkinlik Panosu
            </button>
            <button className={`admin-nav-button ${activeTab === "wheels" ? "active" : ""}`} onClick={() => setActiveTab("wheels")} type="button">
              Cark Ayarlari
            </button>
            <button
              className={`admin-nav-button ${activeTab === "participants" ? "active" : ""}`}
              onClick={() => setActiveTab("participants")}
              type="button"
            >
              Katilimcilar
            </button>
          </div>

          <div className="admin-rail-tools">
            <button className="ghost-button" onClick={() => void exportCsv()} type="button">
              CSV Disa Aktar
            </button>
            <button className="ghost-button" onClick={() => void exportJson()} type="button">
              JSON Disa Aktar
            </button>
            <button className="ghost-button" onClick={() => void importJson()} type="button">
              JSON Ice Aktar
            </button>
            <button
              className="danger-button"
              onClick={() => {
                if (window.confirm("Tum katilimci kayitlari silinsin mi?")) {
                  void resetParticipants().then(() => showToast("Tum katilimci verileri sifirlandi.", "success"));
                }
              }}
              type="button"
            >
              Katilimci Verilerini Sifirla
            </button>
          </div>

          <div className="admin-rail-footer">
            <button className="ghost-button" onClick={() => navigate("/")} type="button">
              Ana Sayfaya Don
            </button>
            <button className="secondary-button" onClick={logoutAdmin} type="button">
              Cikis Yap
            </button>
          </div>
        </aside>

        <div className="admin-content-stack">
          {activeTab === "questions" ? (
            <section className="admin-tab-grid admin-tab-grid-questions">
              <div className="feature-panel">
                <div className="section-header">
                  <div>
                    <div className="eyebrow">Soru Editoru</div>
                    <h2>Yeni soru ekle veya secili soruyu duzenle</h2>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="inline-form two">
                    <input
                      className="text-input slim"
                      onChange={(event) => setQuestionDraft({ ...questionDraft, correctAnswer: event.target.value })}
                      placeholder="Dogru cevap"
                      value={questionDraft.correctAnswer}
                    />
                    <input
                      className="text-input slim"
                      onChange={(event) => setQuestionDraft({ ...questionDraft, image: event.target.value })}
                      placeholder="/questions/yeni-gorsel.jpg veya /map-questions/yeni-harita.svg"
                      value={questionDraft.image}
                    />
                  </div>

                  <div className="inline-form two">
                    <input
                      className="text-input slim"
                      onChange={(event) => setQuestionDraft({ ...questionDraft, questionText: event.target.value })}
                      placeholder="Soru metni"
                      value={questionDraft.questionText}
                    />
                    <select
                      className="text-input slim"
                      onChange={(event) =>
                        setQuestionDraft({
                          ...questionDraft,
                          difficulty: event.target.value as QuestionItem["difficulty"]
                        })
                      }
                      value={questionDraft.difficulty}
                    >
                      <option value="easy">easy</option>
                      <option value="medium">medium</option>
                      <option value="hard">hard</option>
                    </select>
                  </div>

                  <div className="inline-form two">
                    <select
                      className="text-input slim"
                      onChange={(event) =>
                        setQuestionDraft({
                          ...questionDraft,
                          gameMode: event.target.value as GameMode,
                          questionText:
                            event.target.value === "country-map"
                              ? GAME_MODE_META["country-map"].defaultQuestionText
                              : GAME_MODE_META.landmark.defaultQuestionText
                        })
                      }
                      value={getQuestionGameMode(questionDraft)}
                    >
                      <option value="landmark">{GAME_MODE_META.landmark.label}</option>
                      <option value="country-map">{GAME_MODE_META["country-map"].label}</option>
                    </select>
                    <input
                      className="text-input slim"
                      onChange={(event) => setQuestionDraft({ ...questionDraft, city: event.target.value })}
                      placeholder={getQuestionGameMode(questionDraft) === "country-map" ? "Bolge" : "Sehir"}
                      value={questionDraft.city}
                    />
                  </div>

                  <div className="inline-form four">
                    {questionDraft.options.map((option, index) => (
                      <input
                        className="text-input slim"
                        key={`${questionDraft.id}-${index}`}
                        onChange={(event) =>
                          setQuestionDraft({
                            ...questionDraft,
                            options: questionDraft.options.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                          })
                        }
                        placeholder={`Sik ${index + 1}`}
                        value={option}
                      />
                    ))}
                  </div>

                  <div className="inline-form four">
                    <input
                      className="text-input slim"
                      onChange={(event) => setQuestionDraft({ ...questionDraft, country: event.target.value })}
                      placeholder={getQuestionGameMode(questionDraft) === "country-map" ? "Dogru ulke" : "Ulke"}
                      value={questionDraft.country}
                    />
                    <button
                      className="secondary-button"
                      onClick={() =>
                        void saveQuestion(questionDraft).then(() => {
                          setQuestionDraft(createEmptyQuestion());
                          showToast("Soru kaydedildi.", "success");
                        })
                      }
                      type="button"
                    >
                      Soruyu Kaydet
                    </button>
                    <button className="ghost-button" onClick={() => setQuestionDraft(createEmptyQuestion())} type="button">
                      Formu Temizle
                    </button>
                  </div>
                </div>
              </div>

              <div className="feature-panel admin-scroll-panel">
                <div className="section-header">
                  <div>
                    <div className="eyebrow">Soru Listesi</div>
                    <h2>Arat, sec ve duzenle</h2>
                  </div>
                  <input
                    className="text-input slim admin-search-input"
                    onChange={(event) => setQuestionSearch(event.target.value)}
                    placeholder="Mod, sehir, ulke, soru metni veya cevap ara"
                    value={questionSearch}
                  />
                  <select className="text-input slim admin-search-input" onChange={(event) => setQuestionModeFilter(event.target.value as QuestionModeFilter)} value={questionModeFilter}>
                    <option value="all">Tum Modlar</option>
                    <option value="landmark">{GAME_MODE_META.landmark.label}</option>
                    <option value="country-map">{GAME_MODE_META["country-map"].label}</option>
                  </select>
                </div>

                <div className="question-list admin-scroll-region">
                  {visibleQuestions.map((question) => (
                    <div className="question-admin-card" key={question.id}>
                      <img
                        alt={question.correctAnswer}
                        src={resolveQuestionImagePath(question.image)}
                        onError={(event) => {
                          event.currentTarget.src = resolveAssetPath("/ui/image-fallback.svg");
                        }}
                      />
                      <div>
                        <strong>{question.correctAnswer}</strong>
                        <p>
                          {GAME_MODE_META[getQuestionGameMode(question)].label} | {question.city}, {question.country} | {question.difficulty}
                        </p>
                        <p>{question.questionText}</p>
                        <p>{question.options.join(" | ")}</p>
                      </div>
                      <div className="cta-row">
                        <button className="ghost-button" onClick={() => setQuestionDraft(question)} type="button">
                          Duzenle
                        </button>
                        <button className="danger-button" onClick={() => void deleteQuestion(question.id)} type="button">
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === "events" ? (
            <section className="feature-panel">
              <div className="section-header">
                <div>
                  <div className="eyebrow">Etkinlik Panosu</div>
                  <h2>Ana ekrandaki fotograf panosunu duzenle</h2>
                  <p>Her kartin basligini degistirebilir ve bilgisayardan fotograf secip panoya uygulayabilirsin.</p>
                </div>
                <div className="cta-row">
                  <button className="ghost-button" onClick={() => setEventCardDrafts((current) => [...current, createEventCard()])} type="button">
                    Kart Ekle
                  </button>
                  <button className="secondary-button" onClick={() => void handleSaveEventCards()} type="button">
                    Panoyu Kaydet
                  </button>
                </div>
              </div>

              <div className="admin-event-grid">
                {eventCardDrafts.map((eventCard) => (
                  <article className="admin-event-card" key={eventCard.id}>
                    <div className="admin-event-preview">
                      <img alt={eventCard.title} src={resolveAssetPath(eventCard.image)} />
                    </div>
                    <input
                      className="text-input slim"
                      value={eventCard.title}
                      onChange={(event) => setEventCardDrafts((current) => updateEventCard(current, eventCard.id, { title: event.target.value }))}
                    />
                    <input
                      className="text-input slim"
                      value={eventCard.image}
                      onChange={(event) => setEventCardDrafts((current) => updateEventCard(current, eventCard.id, { image: event.target.value }))}
                    />
                    <div className="cta-row">
                      <label className="ghost-button admin-upload-button">
                        Fotograf Sec
                        <input
                          accept="image/*"
                          hidden
                          onChange={(event) => {
                            void handleEventImageUpload(eventCard.id, event.target.files?.[0] ?? null);
                            event.currentTarget.value = "";
                          }}
                          type="file"
                        />
                      </label>
                      <button
                        className="danger-button"
                        onClick={() => setEventCardDrafts((current) => current.filter((item) => item.id !== eventCard.id))}
                        type="button"
                      >
                        Sil
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "wheels" ? (
            <section className="admin-tab-grid admin-tab-grid-wheels">
              <WheelEditorSection
                addLabel="Odul Ekle"
                description="Odul carki icin secenekleri, kisaltmalari, sans oranlarini ve dilim sayilarini buradan ayarlayabilirsin."
                onAdd={() => setRewardWheelDraft((current) => [...current, createWheelOption()])}
                onChange={(optionId, patch) => setRewardWheelDraft((current) => updateWheelOption(current, optionId, patch))}
                onRemove={(optionId) => setRewardWheelDraft((current) => current.filter((option) => option.id !== optionId))}
                onSave={() => void handleSaveRewardWheel()}
                options={rewardWheelDraft}
                title="Odul Carki"
              />
            </section>
          ) : null}

          {activeTab === "participants" ? (
            <section className="feature-panel admin-scroll-panel">
              <div className="section-header">
                <div>
                  <div className="eyebrow">Katilimci Yonetimi</div>
                  <h2>Lider tablosunu hizli duzenle</h2>
                </div>
              </div>

              <div className="admin-list admin-scroll-region">
                {(data?.participants ?? []).map((participant) => (
                  <div className="admin-stack" key={participant.id}>
                    <ParticipantEditor onSave={updateParticipant} participant={participant} />
                    <button className="danger-button" onClick={() => void deleteParticipant(participant.id)} type="button">
                      Katilimciyi Sil
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </AppFrame>
  );
}
