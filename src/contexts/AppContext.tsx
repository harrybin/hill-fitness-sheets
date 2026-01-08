import { createContext, useContext, ReactNode, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Exercise, Session, AppSettings, TrainingEntry } from "@/lib/types";
import { parseXLSX, base64ToArrayBuffer } from "@/lib/utils";

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

  // Auto-load from stored file on mount
  useEffect(() => {
    if (settings?.importedFile && exercises && exercises.length === 0) {
      (async () => {
        try {
          console.log(
            "Auto-loading exercises and sessions from stored file..."
          );
          const arrayBuffer = base64ToArrayBuffer(settings.importedFile.data);
          const { exercises: newExercises, sessions: loadedSessions } =
            await parseXLSX(arrayBuffer);
          console.log(
            `Auto-loaded ${newExercises.length} exercises and ${
              loadedSessions?.length || 0
            } sessions`
          );
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

  // Note: We no longer sync sessions back to importedFile during normal operation.
  // The original template is preserved as-is in importedFile.data.
  // Sessions are only written to the XLSX during the explicit export operation
  // via exportXLSXWithFormatting() which applies data to a fresh copy of the template.

  const loadFromXLSX = async (arrayBuffer: ArrayBuffer) => {
    console.log("loadFromXLSX called");
    const {
      exercises: newExercises,
      sessions: loadedSessions,
      metadata,
    } = await parseXLSX(arrayBuffer);
    console.log("Parsed from XLSX:", {
      exercisesCount: newExercises.length,
      sessionsCount: loadedSessions?.length || 0,
      sessions: loadedSessions,
    });
    setExercises(newExercises);
    if (loadedSessions && loadedSessions.length > 0) {
      // Sessions already have dateInterpolated flag from parsing, no need to add "?" marker
      console.log(
        "Loaded sessions:",
        loadedSessions.map((s) => ({
          date: s.date,
          interpolated: s.dateInterpolated,
          entries: s.entries.length,
        }))
      );
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
      // Date is now clean (no "?" marker), just use it directly
      const sessionIndex = prev.findIndex((s) => s.date === date);
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
        updatedSessions = [...prev, { date: date, entries: [entry] }];
      }

      return updatedSessions;
    });
  };

  const updateEntry = (entry: TrainingEntry, date: string) => {
    setSessions((prevSessions) => {
      const prev = prevSessions || [];
      // Date is now clean (no "?" marker), just use it directly
      const sessionIndex = prev.findIndex((s) => s.date === date);
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
            updatedSessions = prev.filter((s) => s.date !== date);
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
