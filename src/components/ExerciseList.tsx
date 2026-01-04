import { Exercise, Session } from "@/lib/types";
import { Barbell } from "@phosphor-icons/react";
import { CompletedExerciseCard } from "./CompletedExerciseCard";
import { IncompleteExerciseCard } from "./IncompleteExerciseCard";
import { XLSXImportSection } from "./XLSXImportSection";
import { useApp } from "@/contexts/AppContext";
import { arrayBufferToBase64 } from "@/lib/utils";

interface ExerciseListProps {
  exercises: Exercise[];
  currentSession?: Session;
  allSessions?: Session[];
  onSelectExercise: (exercise: Exercise) => void;
  selectedDate?: string;
}

export function ExerciseList({
  exercises,
  currentSession,
  allSessions,
  onSelectExercise,
  selectedDate,
}: ExerciseListProps) {
  const { loadFromXLSX, setSettings } = useApp();

  const handleImport = (arrayBuffer: ArrayBuffer, fileName: string) => {
    loadFromXLSX(arrayBuffer);

    const fileData = arrayBufferToBase64(arrayBuffer);

    setSettings((prev) => ({
      ...prev,
      importedFile: {
        name: fileName,
        data: fileData,
        lastModified: Date.now(),
        size: arrayBuffer.byteLength,
      },
    }));
  };

  const todayDateString = new Date().toISOString().split("T")[0];
  const isOldSession =
    selectedDate && selectedDate.replace(" ?", "").trim() !== todayDateString;
  const getExerciseStatus = (exerciseId: string) => {
    const entry = currentSession?.entries.find(
      (e) => e.exerciseId === exerciseId
    );
    if (!entry || (entry.sets.length === 0 && !entry.skipped)) {
      return undefined;
    }
    return entry;
  };

  const getLastWeight = (exerciseId: string): number | undefined => {
    if (!allSessions || allSessions.length === 0) return undefined;

    const today = new Date().toISOString().split("T")[0];
    const previousSessions = [...allSessions]
      .filter((s) => s.date !== today && s.entries && s.entries.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const session of previousSessions) {
      const entry = session.entries.find((e) => e.exerciseId === exerciseId);
      if (entry && entry.sets && entry.sets.length > 0) {
        const weights = entry.sets.map((s) => s.weight).filter((w) => w > 0);
        if (weights.length > 0) {
          const maxWeight = Math.max(...weights);
          return maxWeight;
        }
      }
    }

    return undefined;
  };

  const validExercises = exercises.filter(
    (ex) =>
      ex.name &&
      ex.name.trim() !== "" &&
      ex.name !== "undefined" &&
      ex.name.toLowerCase() !== "undefined"
  );

  if (validExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Barbell size={64} className="text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Keine Übungen</h2>
        <p className="text-muted-foreground mb-6 max-w-md text-sm">
          Importieren Sie Ihre Übungen aus dem Google Sheet von Hill-Fitness.
          (Dies kann jeder Zeit über die Einstellungen wiederholt werden.)
        </p>

        <XLSXImportSection
          onImport={handleImport}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {validExercises.map((exercise) => {
        const entry = getExerciseStatus(exercise.id);
        const isCompleted = !!entry;
        const lastWeight = getLastWeight(exercise.id);

        return isCompleted ? (
          <CompletedExerciseCard
            key={exercise.id}
            exercise={exercise}
            entry={entry}
            isOldSession={isOldSession}
            onSelect={onSelectExercise}
          />
        ) : (
          <IncompleteExerciseCard
            key={exercise.id}
            exercise={exercise}
            lastWeight={lastWeight}
            isOldSession={isOldSession}
            onSelect={onSelectExercise}
          />
        );
      })}
    </div>
  );
}
