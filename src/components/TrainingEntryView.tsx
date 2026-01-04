import { useState } from "react";
import {
  Exercise,
  TrainingEntry,
  Session,
  TrainingSet,
  PreviousTraining,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SetInput } from "@/components/SetInput";
import { ArrowLeft, Check, Trash, XCircle } from "@phosphor-icons/react";

interface TrainingEntryViewProps {
  exercise: Exercise;
  currentSession?: Session;
  allSessions: Session[];
  defaultSets: number;
  onComplete: (entry: TrainingEntry) => void;
  onUpdate: (entry: TrainingEntry) => void;
  onCancel: () => void;
}

export function TrainingEntryView({
  exercise,
  currentSession,
  allSessions,
  defaultSets,
  onComplete,
  onUpdate,
  onCancel,
}: TrainingEntryViewProps) {
  const existingEntry = currentSession?.entries.find(
    (e) => e.exerciseId === exercise.id
  );

  const getPreviousTraining = (): PreviousTraining | null => {
    if (!allSessions || allSessions.length === 0) return null;

    const today = new Date().toISOString().split("T")[0];
    const sortedSessions = [...allSessions]
      .filter((s) => s.date !== today)
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const session of sortedSessions) {
      const entry = session.entries.find((e) => e.exerciseId === exercise.id);
      if (entry && entry.sets.length > 0) {
        const firstSet = entry.sets[0];
        return {
          exerciseId: exercise.id,
          lastWeight: firstSet.weight,
          lastReps: firstSet.reps,
          date: session.date,
        };
      }
    }

    return null;
  };

  const previousTraining = getPreviousTraining();

  // State for weight (shared by both sets) and reps for each set
  const [weight, setWeight] = useState(
    existingEntry?.sets[0]?.weight || previousTraining?.lastWeight || 10
  );
  const [repsSet1, setRepsSet1] = useState(
    existingEntry?.sets[0]?.reps || previousTraining?.lastReps || 10
  );
  const [repsSet2, setRepsSet2] = useState(
    existingEntry?.sets[1]?.reps || previousTraining?.lastReps || 10
  );

  const handleComplete = () => {
    const sets: TrainingSet[] = [
      { setNumber: 1, weight, reps: repsSet1 },
      { setNumber: 2, weight, reps: repsSet2 },
    ];

    const entry: TrainingEntry = {
      id: existingEntry?.id || `${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      date: new Date().toISOString().split("T")[0],
      sets,
    };

    onComplete(entry);
  };

  const handleDelete = () => {
    if (!existingEntry) return;

    const entry: TrainingEntry = {
      id: existingEntry.id,
      exerciseId: exercise.id,
      date: new Date().toISOString().split("T")[0],
      sets: [],
    };

    onUpdate(entry);
    onCancel();
  };

  const handleSkip = () => {
    const entry: TrainingEntry = {
      id: existingEntry?.id || `${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      date: new Date().toISOString().split("T")[0],
      sets: [],
      skipped: true,
    };

    onComplete(entry);
  };

  const adjustWeight = (delta: number) => {
    setWeight(Math.max(0, weight + delta));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b-2 border-border">
        <div className="p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Button
              variant="outline"
              size="lg"
              onClick={onCancel}
              className="h-12 px-4"
            >
              <ArrowLeft size={24} className="mr-2" />
              Zurück
            </Button>
            {existingEntry && (
              <Button
                variant="destructive"
                size="lg"
                onClick={handleDelete}
                className="h-12 px-4"
              >
                <Trash size={24} weight="bold" />
              </Button>
            )}
          </div>

          <div className="mb-2">
            <h1 className="text-2xl font-bold mb-0.5 truncate">
              {exercise.name}
            </h1>
            {exercise.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {exercise.notes}
              </p>
            )}
          </div>

          {previousTraining && (
            <div className="text-sm text-muted-foreground">
              Vorher: {previousTraining.lastWeight}kg ×{" "}
              {previousTraining.lastReps}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 space-y-4 pb-32">
        <div>
          <label className="text-sm font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
            Gewicht
          </label>

          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => adjustWeight(-5)}
              className="h-11 w-11 p-0 text-xs"
            >
              -5
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => adjustWeight(-1)}
              className="h-11 w-11 p-0 text-xs"
            >
              -1
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => adjustWeight(-0.5)}
              className="h-11 w-11 p-0 text-xs"
            >
              -0.5
            </Button>

            <div className="flex-1 max-w-[140px]">
              <div className="text-center font-mono font-bold text-5xl text-primary">
                {weight}
              </div>
              <div className="text-center text-xs text-muted-foreground mt-0.5">
                kg
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => adjustWeight(0.5)}
              className="h-11 w-11 p-0 text-xs"
            >
              +0.5
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => adjustWeight(1)}
              className="h-11 w-11 p-0 text-xs"
            >
              +1
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => adjustWeight(5)}
              className="h-11 w-11 p-0 text-xs"
            >
              +5
            </Button>
          </div>
        </div>

        <div className="border-t border-border my-4"></div>

        <SetInput setNumber={1} reps={repsSet1} onRepsChange={setRepsSet1} />

        <SetInput setNumber={2} reps={repsSet2} onRepsChange={setRepsSet2} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t border-border">
        <div className="flex gap-3">
          <Button
            size="lg"
            variant="outline"
            className="h-24 px-8"
            onClick={handleSkip}
          >
            <XCircle size={24} weight="bold" className="text-red-500" />
          </Button>
          <Button
            size="lg"
            className="flex-1 h-24 text-lg font-bold"
            onClick={handleComplete}
          >
            <Check size={24} weight="bold" className="mr-2" />
            Übung abschließen
          </Button>
        </div>
      </div>
    </div>
  );
}
