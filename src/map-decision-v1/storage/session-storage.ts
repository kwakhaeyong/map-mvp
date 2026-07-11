import { MapSession, STORAGE_KEY } from "../types";
import { isValidSession } from "../engine/session";

export function loadSession(): MapSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (isValidSession(parsed)) return parsed;
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: MapSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}
