import { contextBridge, ipcRenderer } from "electron";
import type { AppDatabase, EventCardItem, ParticipantRecord, QuestionItem, SettingsState, WheelOptionsUpdate } from "./types";

const api = {
  getInitialData: () => ipcRenderer.invoke("app:get-initial-data") as Promise<AppDatabase>,
  saveParticipant: (participant: ParticipantRecord) =>
    ipcRenderer.invoke("app:save-participant", participant) as Promise<AppDatabase>,
  updateParticipant: (participant: ParticipantRecord) =>
    ipcRenderer.invoke("app:update-participant", participant) as Promise<AppDatabase>,
  deleteParticipant: (participantId: string) =>
    ipcRenderer.invoke("app:delete-participant", participantId) as Promise<AppDatabase>,
  resetParticipants: () => ipcRenderer.invoke("app:reset-participants") as Promise<AppDatabase>,
  saveSettings: (settings: SettingsState) =>
    ipcRenderer.invoke("app:save-settings", settings) as Promise<AppDatabase>,
  saveQuestion: (question: QuestionItem) =>
    ipcRenderer.invoke("app:save-question", question) as Promise<AppDatabase>,
  saveEventCards: (eventCards: EventCardItem[]) =>
    ipcRenderer.invoke("app:save-event-cards", eventCards) as Promise<AppDatabase>,
  saveWheelOptions: (update: WheelOptionsUpdate) =>
    ipcRenderer.invoke("app:save-wheel-options", update) as Promise<AppDatabase>,
  deleteQuestion: (questionId: string) =>
    ipcRenderer.invoke("app:delete-question", questionId) as Promise<AppDatabase>,
  exportJson: () => ipcRenderer.invoke("app:export-json"),
  exportCsv: () => ipcRenderer.invoke("app:export-csv"),
  importJson: () => ipcRenderer.invoke("app:import-json"),
  setFullscreen: (fullscreen: boolean) => ipcRenderer.invoke("app:set-fullscreen", fullscreen),
  getFullscreen: () => ipcRenderer.invoke("app:get-fullscreen") as Promise<{ fullscreen: boolean }>
};

contextBridge.exposeInMainWorld("quizApi", api);
