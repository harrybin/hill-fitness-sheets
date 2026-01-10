import { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Exercise, Session, AppSettings, TrainingEntry } from "@/lib/types";
import { parseXLSX, base64ToArrayBuffer, toISODate } from "@/lib/utils";

interface AppContextValue {
  exercises: Exercise[];
  sessions: Session[];
  settings: AppSettings;
  setExercises: (
    value: Exercise[] | ((prev: Exercise[]) => Exercise[])
  ) => void;
  setSessions: (value: Session[] | ((prev: Session[]) => Session[])) => void;
  setSettings: (
    value: AppSettings | ((prev: AppSettings) => AppSettings)
  ) => void;
  completeEntry: (entry: TrainingEntry, date: string) => void;
  updateEntry: (entry: TrainingEntry, date: string) => void;
  updateExercise: (exercise: Exercise) => void;
  loadFromXLSX: (
    arrayBuffer: ArrayBuffer
  ) => Promise<{ exerciseCount: number; sessionCount: number }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(
    "exercises",
    []
  );
  const [sessions, setSessions] = useLocalStorage<Session[]>("sessions", []);
  const [settings, setSettings] = useLocalStorage<AppSettings>("settings", {});

  // Prevent auto-load from running if an explicit import is in progress
  const autoLoadRef = useRef(false);
  useEffect(() => {
    if (autoLoadRef.current) return;
    if (settings?.importedFile && exercises && exercises.length === 0) {
      autoLoadRef.current = true;
      (async () => {
        try {
          const arrayBuffer = base64ToArrayBuffer(settings.importedFile.data);
          const { exercises: newExercises, sessions: loadedSessions } =
            await parseXLSX(arrayBuffer);
          setExercises(newExercises);
          if (loadedSessions && loadedSessions.length > 0) {
            setSessions(loadedSessions);
          }
        } catch (error) {
          console.error("Auto-load failed:", error);
        }
      })();
    }
  }, [settings?.importedFile, exercises, setExercises, setSessions]);

  // Migration: normalize any legacy session/date formats to ISO on load
  useEffect(() => {
    try {
      const prev = sessions || [];
      const normalized = prev.map((s) => ({
        ...s,
        date: toISODate(s.date),
        entries: (s.entries || []).map((e) => ({
          ...e,
          date: toISODate(e.date),
        })),
      }));
      const changed =
        normalized.length !== prev.length ||
        normalized.some((s, i) => s.date !== prev[i].date);
      if (changed) {
        setSessions(normalized);
      }
    } catch (err) {
      console.warn("Session date normalization skipped:", err);
    }
  }, [sessions, setSessions]);

  // Note: We no longer sync sessions back to importedFile during normal operation.
  // The original template is preserved as-is in importedFile.data.
  // Sessions are only written to the XLSX during the explicit export operation
  // via exportXLSXWithFormatting() which applies data to a fresh copy of the template.

  const loadFromXLSX = async (arrayBuffer: ArrayBuffer) => {
    const {
      exercises: newExercises,
      sessions: loadedSessions,
      metadata,
    } = await parseXLSX(arrayBuffer);
    setExercises(newExercises);
    if (loadedSessions && loadedSessions.length > 0) {
      // Sessions already have dateInterpolated flag from parsing, no need to add "?" marker
      setSessions(loadedSessions);
    }
    setSettings((prev) => ({
      ...(prev || {}),
      ...metadata,
    }));

    return {
      exerciseCount: newExercises.length,
      sessionCount: loadedSessions?.length || 0,
    };
  };

  const completeEntry = (entry: TrainingEntry, date: string) => {
    setSessions((prevSessions) => {
      const prev = prevSessions || [];
      const cleanDate = toISODate(date);
      const sessionIndex = prev.findIndex((s) => s.date === cleanDate);
      let updatedSessions: Session[];

      if (sessionIndex >= 0) {
        updatedSessions = [...prev];
        const entryIndex = updatedSessions[sessionIndex].entries.findIndex(
          (e) => e.exerciseId === entry.exerciseId
        );

        if (entryIndex >= 0) {
          updatedSessions[sessionIndex].entries[entryIndex] = entry;
        } else {
          updatedSessions[sessionIndex].entries.push(entry);
        }
      } else {
        updatedSessions = [...prev, { date: cleanDate, entries: [entry] }];
      }

      return updatedSessions;
    });
  };

  const updateEntry = (entry: TrainingEntry, date: string) => {
    setSessions((prevSessions) => {
      const prev = prevSessions || [];
      const cleanDate = toISODate(date);
      const sessionIndex = prev.findIndex((s) => s.date === cleanDate);
      let updatedSessions: Session[];

      if (sessionIndex >= 0) {
        updatedSessions = [...prev];

        if (entry.sets.length === 0) {
          // Remove entry if no sets
          updatedSessions[sessionIndex].entries = updatedSessions[
            sessionIndex
          ].entries.filter((e) => e.exerciseId !== entry.exerciseId);

          // Remove session if no entries
          if (updatedSessions[sessionIndex].entries.length === 0) {
            updatedSessions = prev.filter((s) => s.date !== cleanDate);
          }
        } else {
          const entryIndex = updatedSessions[sessionIndex].entries.findIndex(
            (e) => e.exerciseId === entry.exerciseId
          );

          if (entryIndex >= 0) {
            updatedSessions[sessionIndex].entries[entryIndex] = entry;
          }
        }
      } else {
        updatedSessions = prev;
      }

      return updatedSessions;
    });
  };

  const updateExercise = (exercise: Exercise) => {
    setExercises((prevExercises) => {
      const prev = prevExercises || [];
      const exerciseIndex = prev.findIndex((e) => e.id === exercise.id);

      if (exerciseIndex >= 0) {
        const updated = [...prev];
        updated[exerciseIndex] = exercise;
        return updated;
      }

      return prev;
    });
  };

  const value: AppContextValue = {
    exercises: exercises || [],
    sessions: sessions || [],
    settings: settings || {},
    setExercises,
    setSessions,
    setSettings,
    completeEntry,
    updateEntry,
    updateExercise,
    loadFromXLSX,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
