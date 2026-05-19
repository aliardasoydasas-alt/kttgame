import { app, BrowserWindow, dialog, ipcMain, nativeImage } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  createDefaultDatabase,
  ensureQuestionModes,
  migrateLegacyRewardWheelOptions,
  normalizeEventCards,
  normalizeParticipants,
  normalizeQuestions,
  normalizeWheelOptions,
  parseImportPayload,
  serializeAsCsv,
  serializeAsJson,
  upsertParticipant,
  upsertQuestion,
  sortLeaderboard
} from "./storage";
import type {
  AppDatabase,
  ImportPayload,
  ParticipantRecord,
  QuestionItem,
  SettingsState,
  WheelOptionsUpdate
} from "./types";

const appRoot = app.getAppPath();
const isDev = !app.isPackaged;
const distPath = path.join(appRoot, "dist");
const preloadPath = path.join(__dirname, "preload.js");

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let databaseCache: AppDatabase | null = null;
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function getDataFilePath() {
  return path.join(app.getPath("userData"), "quiz-data.json");
}

async function ensureDatabase(): Promise<AppDatabase> {
  if (databaseCache) {
    return databaseCache;
  }

  const dataPath = getDataFilePath();
  if (!existsSync(dataPath)) {
    const initialData = createDefaultDatabase();
    await fs.writeFile(dataPath, JSON.stringify(initialData, null, 2), "utf8");
    databaseCache = initialData;
    return initialData;
  }

  try {
    const content = await fs.readFile(dataPath, "utf8");
    const parsed = JSON.parse(content) as AppDatabase;
    const defaults = createDefaultDatabase();
    const normalized = {
      ...defaults,
      ...parsed,
      participants: sortLeaderboard(normalizeParticipants(parsed.participants ?? [])),
      questions: ensureQuestionModes(parsed.questions ?? [], defaults.questions),
      eventCards: normalizeEventCards(parsed.eventCards, defaults.eventCards),
      rewardWheelOptions: migrateLegacyRewardWheelOptions(parsed.rewardWheelOptions),
      penaltyWheelOptions: normalizeWheelOptions(parsed.penaltyWheelOptions, defaults.penaltyWheelOptions, "penalty"),
      settings: { ...defaults.settings, ...(parsed.settings ?? {}) }
    };
    databaseCache = normalized;
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      await persistDatabase(normalized);
    }
    return normalized;
  } catch {
    const fallback = createDefaultDatabase();
    databaseCache = fallback;
    await persistDatabase(fallback);
    return fallback;
  }
}

async function persistDatabase(nextData: AppDatabase) {
  databaseCache = nextData;
  await fs.mkdir(path.dirname(getDataFilePath()), { recursive: true });
  await fs.writeFile(getDataFilePath(), JSON.stringify(nextData, null, 2), "utf8");
}

async function updateDatabase(mutator: (current: AppDatabase) => AppDatabase) {
  const current = await ensureDatabase();
  const next = mutator(current);
  await persistDatabase(next);
  return next;
}

function getIcon() {
  const iconPath = isDev ? path.join(appRoot, "public", "branding", "app-icon.png") : path.join(process.resourcesPath, "app-icon.png");
  return existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 680,
    height: 420,
    frame: false,
    resizable: false,
    transparent: false,
    center: true,
    backgroundColor: "#160607",
    icon: getIcon(),
    show: false
  });

  splashWindow.loadFile(path.join(appRoot, "electron", "splash.html"));
  splashWindow.once("ready-to-show", () => splashWindow?.show());
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1280,
    minHeight: 800,
    backgroundColor: "#130405",
    icon: getIcon(),
    autoHideMenuBar: true,
    fullscreen: true,
    title: "Kültür ve Turizm Topluluğu",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(distPath, "index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.on("ready-to-show", () => {
    splashWindow?.close();
    splashWindow = null;
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function focusMainWindow() {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.focus();
}

if (hasSingleInstanceLock) {
  app.on("second-instance", () => {
    focusMainWindow();
  });

  app.whenReady().then(async () => {
    createSplashWindow();
    await ensureDatabase();
    createMainWindow();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

ipcMain.handle("app:get-initial-data", async () => ensureDatabase());

ipcMain.handle("app:save-participant", async (_event, participant: ParticipantRecord) =>
  updateDatabase((current) => ({
    ...current,
    participants: sortLeaderboard(normalizeParticipants(upsertParticipant(current.participants, participant)))
  }))
);

ipcMain.handle("app:update-participant", async (_event, participant: ParticipantRecord) =>
  updateDatabase((current) => ({
    ...current,
    participants: sortLeaderboard(normalizeParticipants(upsertParticipant(current.participants, participant)))
  }))
);

ipcMain.handle("app:delete-participant", async (_event, participantId: string) =>
  updateDatabase((current) => ({
    ...current,
    participants: current.participants.filter((item) => item.id !== participantId)
  }))
);

ipcMain.handle("app:reset-participants", async () =>
  updateDatabase((current) => ({
    ...current,
    participants: []
  }))
);

ipcMain.handle("app:save-settings", async (_event, settings: SettingsState) =>
  updateDatabase((current) => ({
    ...current,
    settings: { ...current.settings, ...settings }
  }))
);

ipcMain.handle("app:save-question", async (_event, question: QuestionItem) =>
  updateDatabase((current) => ({
    ...current,
    questions: ensureQuestionModes(upsertQuestion(current.questions, question), createDefaultDatabase().questions)
  }))
);

ipcMain.handle("app:save-event-cards", async (_event, eventCards: AppDatabase["eventCards"]) =>
  updateDatabase((current) => ({
    ...current,
    eventCards: normalizeEventCards(eventCards, createDefaultDatabase().eventCards)
  }))
);

ipcMain.handle("app:save-wheel-options", async (_event, update: WheelOptionsUpdate) =>
  updateDatabase((current) => ({
    ...current,
    rewardWheelOptions: update.rewardWheelOptions
      ? normalizeWheelOptions(update.rewardWheelOptions, createDefaultDatabase().rewardWheelOptions, "reward")
      : current.rewardWheelOptions,
    penaltyWheelOptions: update.penaltyWheelOptions
      ? normalizeWheelOptions(update.penaltyWheelOptions, createDefaultDatabase().penaltyWheelOptions, "penalty")
      : current.penaltyWheelOptions
  }))
);

ipcMain.handle("app:delete-question", async (_event, questionId: string) =>
  updateDatabase((current) => ({
    ...current,
    questions: current.questions.filter((item) => item.id !== questionId)
  }))
);

ipcMain.handle("app:export-json", async () => {
  const data = await ensureDatabase();
  const result = await dialog.showSaveDialog({
    title: "Verileri JSON olarak dışa aktar",
    defaultPath: path.join(app.getPath("documents"), "kultur-turizm-yarisma-verileri.json"),
    filters: [{ name: "JSON", extensions: ["json"] }]
  });

  if (result.canceled || !result.filePath) {
    return { success: false };
  }

  await fs.writeFile(result.filePath, serializeAsJson(data), "utf8");
  return { success: true, filePath: result.filePath };
});

ipcMain.handle("app:export-csv", async () => {
  const data = await ensureDatabase();
  const result = await dialog.showSaveDialog({
    title: "Lider tablosunu CSV olarak dışa aktar",
    defaultPath: path.join(app.getPath("documents"), "kultur-turizm-lider-tablosu.csv"),
    filters: [{ name: "CSV", extensions: ["csv"] }]
  });

  if (result.canceled || !result.filePath) {
    return { success: false };
  }

  await fs.writeFile(result.filePath, serializeAsCsv(data.participants), "utf8");
  return { success: true, filePath: result.filePath };
});

ipcMain.handle("app:import-json", async () => {
  const result = await dialog.showOpenDialog({
    title: "JSON verisi içe aktar",
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });

  if (result.canceled || !result.filePaths.length) {
    return { success: false };
  }

  const raw = await fs.readFile(result.filePaths[0], "utf8");
  const parsed = parseImportPayload(raw);
  const nextData = await updateDatabase((current) => mergeImportPayload(current, parsed));
  return { success: true, data: nextData };
});

ipcMain.handle("app:set-fullscreen", async (_event, fullscreen: boolean) => {
  mainWindow?.setFullScreen(fullscreen);
  return { success: true };
});

ipcMain.handle("app:get-fullscreen", async () => ({
  fullscreen: mainWindow?.isFullScreen() ?? false
}));

function mergeImportPayload(current: AppDatabase, payload: ImportPayload): AppDatabase {
  return {
    participants: sortLeaderboard(normalizeParticipants(payload.participants ?? current.participants)),
    questions: payload.questions?.length ? ensureQuestionModes(payload.questions, createDefaultDatabase().questions) : current.questions,
    eventCards: payload.eventCards ? normalizeEventCards(payload.eventCards, createDefaultDatabase().eventCards) : current.eventCards,
    rewardWheelOptions: payload.rewardWheelOptions
      ? normalizeWheelOptions(payload.rewardWheelOptions, createDefaultDatabase().rewardWheelOptions, "reward")
      : current.rewardWheelOptions,
    penaltyWheelOptions: payload.penaltyWheelOptions
      ? normalizeWheelOptions(payload.penaltyWheelOptions, createDefaultDatabase().penaltyWheelOptions, "penalty")
      : current.penaltyWheelOptions,
    settings: { ...current.settings, ...(payload.settings ?? {}) }
  };
}
