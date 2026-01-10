import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Exercise, Session } from "./types";

// Re-exports from specialized XLSX modules
export { parseXLSX } from "./xlsxImport";
export { updateXLSXWithSessions, exportXLSXWithFormatting } from "./xlsxExport";

// Utility function: combine class names with Tailwind merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Normalize various date string formats to ISO YYYY-MM-DD
export function toISODate(dateString: string): string {
  if (!dateString) return "";
  const trimmed = dateString.replace(" ?", "").trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // German format DD.MM.YYYY
  const deMatch = trimmed.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (deMatch) {
    const [_, dd, mm, yyyy] = deMatch;
    return `${yyyy}-${mm}-${dd}`;
  }
  // Fallback: extract YYYY, MM, DD in any order
  const y = trimmed.match(/(\d{4})/);
  const m = trimmed.match(/(?:^|\D)(\d{2})(?:\D|$)/);
  const d = trimmed.match(/(?:^|\D)(\d{2})(?:\D|$)/);
  if (y && m && d) {
    const yyyy = y[1];
    const mm = m[1];
    const dd = d[1];
    if (/^\d{4}$/.test(yyyy) && /^\d{2}$/.test(mm) && /^\d{2}$/.test(dd)) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return trimmed;
}

// Format a date string to German DD.MM.YYYY for display
export function formatDateDE(dateString: string): string {
  const iso = toISODate(dateString);
  const parts = iso.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    const d = parseInt(parts[2]);
    const dt = new Date(y, m, d);
    return dt.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return dateString;
}

// Convert base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Prefer Node.js Buffer when available (more tolerant), fallback to atob
  if (typeof Buffer !== "undefined") {
    const buf: any = Buffer.from(base64, "base64");
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; i++) view[i] = buf[i];
    return ab;
  }
  if (typeof atob === "function") {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  // Last resort: empty buffer
  return new ArrayBuffer(0);
}

// Convert ArrayBuffer to base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  // Prefer Node.js Buffer when available
  if (typeof Buffer !== "undefined") {
    return Buffer.from(new Uint8Array(buffer)).toString("base64");
  }
  if (typeof btoa === "function") {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  return "";
}

// === Statistics Functions ===

// Get exercises that were skipped most frequently
export function getTopSkippedExercises(
  allSessions: Session[],
  exercises: Exercise[],
  limit: number = 10
): {
  name: string;
  count: number;
}[] {
  const skipCounts = new Map<string, number>();

  for (const session of allSessions) {
    for (const entry of session.entries) {
      if (entry.skipped) {
        const exerciseName =
          exercises.find((e) => e.id === entry.exerciseId)?.name ||
          entry.exerciseId;
        skipCounts.set(exerciseName, (skipCounts.get(exerciseName) || 0) + 1);
      }
    }
  }

  return Array.from(skipCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Get training frequency by month - returns Record<month, count>
export function getMonthlyTrainingFrequency(
  allSessions: Session[]
): Record<string, number> {
  const frequencyMap: Record<string, number> = {};

  for (const session of allSessions) {
    const month = session.date.slice(0, 7); // YYYY-MM
    frequencyMap[month] = (frequencyMap[month] || 0) + 1;
  }

  return frequencyMap;
}

// Get daily training frequency
export function getDailyTrainingFrequency(
  allSessions: Session[]
): Record<string, number> {
  const frequencyMap: Record<string, number> = {};

  for (const session of allSessions) {
    frequencyMap[session.date] = (frequencyMap[session.date] || 0) + 1;
  }

  return frequencyMap;
}

// Get exercise volume history (sets × reps × weight)
// Returns: Record<exerciseId, array of {date, volume}>
export function getExerciseVolumeHistory(
  allSessions: Session[]
): Record<string, { date: string; volume: number }[]> {
  const result: Record<string, { date: string; volume: number }[]> = {};

  for (const session of allSessions) {
    for (const entry of session.entries) {
      if (entry.skipped) continue;

      const volume = entry.sets.reduce(
        (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
        0
      );

      if (!result[entry.exerciseId]) {
        result[entry.exerciseId] = [];
      }
      result[entry.exerciseId].push({ date: session.date, volume });
    }
  }

  return result;
}

// Get personal records by exercise
// Returns: Record<exerciseId, {date, weight, reps}>
export function getExercisePRs(
  allSessions: Session[]
): Record<string, { date: string; weight: number; reps: number }> {
  const prs: Record<string, { date: string; weight: number; reps: number }> =
    {};

  for (const session of allSessions) {
    for (const entry of session.entries) {
      if (entry.skipped) continue;

      for (const set of entry.sets) {
        const prev = prs[entry.exerciseId];
        if (
          !prev ||
          (set.weight || 0) > prev.weight ||
          ((set.weight || 0) === prev.weight && (set.reps || 0) > prev.reps)
        ) {
          prs[entry.exerciseId] = {
            date: session.date,
            weight: set.weight || 0,
            reps: set.reps || 0,
          };
        }
      }
    }
  }

  return prs;
}

// Get exercise progression data
// Returns: Record<exerciseId, array of {date, maxWeight, avgWeight, avgReps}>
export function getExerciseProgression(
  allSessions: Session[]
): Record<
  string,
  { date: string; maxWeight: number; avgWeight: number; avgReps: number }[]
> {
  const result: Record<
    string,
    { date: string; maxWeight: number; avgWeight: number; avgReps: number }[]
  > = {};

  for (const session of allSessions) {
    for (const entry of session.entries) {
      if (entry.skipped) continue;

      const weights = entry.sets.map((s) => s.weight || 0);
      const reps = entry.sets.map((s) => s.reps || 0);

      if (weights.length === 0 || reps.length === 0) continue;

      const maxWeight = Math.max(...weights);
      const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
      const avgReps = reps.reduce((a, b) => a + b, 0) / reps.length;

      if (!result[entry.exerciseId]) {
        result[entry.exerciseId] = [];
      }

      result[entry.exerciseId].push({
        date: session.date,
        maxWeight,
        avgWeight,
        avgReps,
      });
    }
  }

  return result;
}
