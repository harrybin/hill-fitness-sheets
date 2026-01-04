import { createContext, useContext, ReactNode, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Exercise, Session, AppSettings, TrainingEntry } from "@/lib/types";
import {
  parseXLSX,
  base64ToArrayBuffer,
  updateXLSXWithSessions,
} from "@/lib/utils";

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
  completeEntry: (entry: TrainingEntry) => void;
  updateEntry: (entry: TrainingEntry) => void;
  updateExercise: (exercise: Exercise) => void;
  loadFromXLSX: (arrayBuffer: ArrayBuffer) => void;
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
      try {
        console.log("Auto-loading exercises and sessions from stored file...");
        const arrayBuffer = base64ToArrayBuffer(settings.importedFile.data);
        const { exercises: newExercises, sessions: loadedSessions } =
          parseXLSX(arrayBuffer);
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
    }
  }, [settings?.importedFile, exercises, setExercises, setSessions]);

  // Sync sessions back to XLSX when they change
  useEffect(() => {
    if (
      settings?.importedFile &&
      sessions &&
      sessions.length > 0 &&
      exercises &&
      exercises.length > 0
    ) {
      console.log("Syncing sessions back to XLSX...");
      const newData = updateXLSXWithSessions(
        settings.importedFile.data,
        sessions,
        exercises
      );
      if (newData !== settings.importedFile.data) {
        console.log("XLSX data updated with current sessions");
        setSettings((prev) => {
          if (!prev?.importedFile) return prev || {};
          return {
            ...prev,
            importedFile: {
              ...prev.importedFile,
              data: newData,
              lastModified: Date.now(),
            },
          };
        });
      }
    }
  }, [sessions, exercises, settings?.importedFile, setSettings]);

  const loadFromXLSX = (arrayBuffer: ArrayBuffer) => {
    console.log("loadFromXLSX called");
    const {
      exercises: newExercises,
      sessions: loadedSessions,
      metadata,
    } = parseXLSX(arrayBuffer);
    console.log("Parsed from XLSX:", {
      exercisesCount: newExercises.length,
      sessionsCount: loadedSessions?.length || 0,
      sessions: loadedSessions,
    });
    setExercises(newExercises);
    if (loadedSessions && loadedSessions.length > 0) {
      console.log("Setting sessions to:", loadedSessions);
      setSessions(loadedSessions);
    }
    setSettings((prev) => ({
      ...(prev || {}),
      ...metadata,
    }));
  };

  const completeEntry = (entry: TrainingEntry) => {
    const today = new Date().toISOString().split("T")[0];

    setSessions((prevSessions) => {
      const prev = prevSessions || [];
      const sessionIndex = prev.findIndex((s) => s.date === today);
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
        updatedSessions = [...prev, { date: today, entries: [entry] }];
      }

      return updatedSessions;
    });
  };

  const updateEntry = (entry: TrainingEntry) => {
    const today = new Date().toISOString().split("T")[0];

    setSessions((prevSessions) => {
      const prev = prevSessions || [];
      const sessionIndex = prev.findIndex((s) => s.date === today);
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
            updatedSessions = prev.filter((s) => s.date !== today);
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
