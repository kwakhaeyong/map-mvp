import { MapSession, SCHEMA_VERSION, STORAGE_KEY } from "../types";
import { isValidSession, now } from "../engine/session";

function migrateSession(value: unknown): MapSession | null {
  const candidate = value as Partial<MapSession> | null;
  if (!candidate || !Array.isArray(candidate.messages) || !Array.isArray(candidate.nodes)) return null;
  return {
    version: SCHEMA_VERSION,
    stage: candidate.stage === "result" ? "result" : candidate.stage === "landing" ? "landing" : "conversation",
    selectedTopic: candidate.selectedTopic,
    preferredMapType: candidate.preferredMapType === "decision" ? "decision" : "thinking",
    messages: candidate.messages,
    nodes: candidate.nodes,
    relations: Array.isArray(candidate.relations) ? candidate.relations : [],
    checkpointStatus: candidate.checkpointStatus,
    startedAt: candidate.startedAt || now(),
    updatedAt: now(),
  };
}

export function loadSession(): MapSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (isValidSession(parsed)) return parsed;
    const migrated = migrateSession(parsed);
    if (migrated) {
      saveSession(migrated);
      return migrated;
    }
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: MapSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, version: SCHEMA_VERSION }));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}
