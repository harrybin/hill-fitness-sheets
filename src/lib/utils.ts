import clsx, { type ClassValue, type ClassNameValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Exercise, Session, TrainingEntry } from "./types";

// Re-exports from specialized XLSX modules
export { parseXLSX } from "./xlsxImport";
export { updateXLSXWithSessions, exportXLSXWithFormatting } from "./xlsxExport";

// Utility function: combine class names with Tailwind merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// === Statistics Functions ===

// Get exercises that were skipped most frequently
export function getTopSkippedExercises(
  allSessions: Session[],
  exercises: Exercise[],
  limit: number = 10
): {
  exercise: Exercise;
  skippedCount: number;
  totalCount: number;
  skipPercentage: number;
}[] {
  const skipCounts = new Map<string, { skipped: number; total: number }>();

  for (const session of allSessions) {
    for (const entry of session.entries) {
      const current = skipCounts.get(entry.exerciseId) || {
        skipped: 0,
        total: 0,
      };
      current.total++;
      if (entry.skipped) {
        current.skipped++;
      }
      skipCounts.set(entry.exerciseId, current);
    }
  }

  return Array.from(skipCounts.entries())
    .map(([exerciseId, counts]) => ({
      exercise: exercises.find((e) => e.id === exerciseId)!,
      skippedCount: counts.skipped,
      totalCount: counts.total,
      skipPercentage: Math.round((counts.skipped / counts.total) * 100),
    }))
    .sort((a, b) => b.skipPercentage - a.skipPercentage)
    .slice(0, limit);
}

// Get training frequency by month
export function getMonthlyTrainingFrequency(
  allSessions: Session[]
): { month: string; count: number }[] {
  const frequencyMap = new Map<string, number>();

  for (const session of allSessions) {
    const [year, month] = session.date.split("-");
    const monthKey = `${year}-${month}`;
    frequencyMap.set(monthKey, (frequencyMap.get(monthKey) || 0) + 1);
  }

  return Array.from(frequencyMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Get daily training frequency
export function getDailyTrainingFrequency(
  allSessions: Session[]
): { date: string; exerciseCount: number; totalSets: number }[] {
  return allSessions.map((session) => {
    let totalSets = 0;
    for (const entry of session.entries) {
      totalSets += entry.sets.length;
    }
    return {
      date: session.date,
      exerciseCount: session.entries.length,
      totalSets,
    };
  });
}

// Get exercise volume history (sets × reps × weight)
export function getExerciseVolumeHistory(
  allSessions: Session[],
  exerciseId: string
): { date: string; volume: number; setCount: number }[] {
  return allSessions
    .map((session) => {
      const entry = session.entries.find((e) => e.exerciseId === exerciseId);
      if (!entry || entry.skipped) {
        return null;
      }
      const volume = entry.sets.reduce(
        (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
        0
      );
      const setCount = entry.sets.length;
      return { date: session.date, volume, setCount };
    })
    .filter((item) => item !== null) as {
    date: string;
    volume: number;
    setCount: number;
  }[];
}

// Get personal records by exercise
export function getExercisePRs(
  allSessions: Session[],
  exerciseId: string
): { date: string; weight: number; reps: number }[] {
  const prs: { date: string; weight: number; reps: number }[] = [];
  let maxWeight = 0;

  for (const session of allSessions) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId);
    if (!entry || entry.skipped) continue;

    for (const set of entry.sets) {
      if ((set.weight || 0) > maxWeight) {
        maxWeight = set.weight || 0;
        prs.push({
          date: session.date,
          weight: set.weight || 0,
          reps: set.reps || 0,
        });
      }
    }
  }

  return prs.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Get exercise progression data
export function getExerciseProgression(
  allSessions: Session[],
  exerciseId: string
): { date: string; weight: number; reps: number; setNumber: number }[] {
  const progression: {
    date: string;
    weight: number;
    reps: number;
    setNumber: number;
  }[] = [];

  for (const session of allSessions) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId);
    if (!entry || entry.skipped) continue;

    for (const set of entry.sets) {
      progression.push({
        date: session.date,
        weight: set.weight || 0,
        reps: set.reps || 0,
        setNumber: set.setNumber,
      });
    }
  }

  return progression.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
