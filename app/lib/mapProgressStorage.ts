export const MAP_PROGRESS_STORAGE_KEY = "map-question-progress";

export interface MapProgressData {
  currentStep: number;
  answers: Record<string, string>;
  startedAt: string;
  lastUpdatedAt: string;
}

export function createInitialMapProgress(totalQuestions: number, now = new Date().toISOString()): MapProgressData {
  return {
    currentStep: 0,
    answers: Object.fromEntries(Array.from({ length: totalQuestions }, (_, index) => [`q${index + 1}`, ""])),
    startedAt: now,
    lastUpdatedAt: now,
  };
}

export function readMapProgress(totalQuestions: number): MapProgressData | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(MAP_PROGRESS_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<MapProgressData>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.answers !== "object" || parsed.answers === null) {
      return null;
    }

    const currentStep = Number.isInteger(parsed.currentStep) ? parsed.currentStep as number : 0;
    const safeStep = Math.min(Math.max(currentStep, 0), totalQuestions - 1);
    const now = new Date().toISOString();

    return {
      currentStep: safeStep,
      answers: Object.fromEntries(
        Array.from({ length: totalQuestions }, (_, index) => {
          const key = `q${index + 1}`;
          const value = parsed.answers?.[key];
          return [key, typeof value === "string" ? value : ""];
        }),
      ),
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : now,
      lastUpdatedAt: typeof parsed.lastUpdatedAt === "string" ? parsed.lastUpdatedAt : now,
    };
  } catch {
    return null;
  }
}

export function writeMapProgress(progress: MapProgressData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MAP_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

export function clearMapProgress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MAP_PROGRESS_STORAGE_KEY);
}

export function mapProgressHasAnswers(progress: MapProgressData | null) {
  if (!progress) return false;
  return Object.values(progress.answers).some((answer) => answer.trim().length > 0);
}
