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
import { WeightInput } from "@/components/WeightInput";
import { ArrowLeft, Check, Trash, XCircle } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BodyPartIconComponent } from "@/lib/useBodyPartIcon";

interface TrainingEntryViewProps {
  exercise: Exercise;
  currentSession?: Session;
  allSessions: Session[];
  defaultSets: number;
  selectedDate: string;
  onComplete: (entry: TrainingEntry, date: string) => void;
  onUpdate: (entry: TrainingEntry, date: string) => void;
  onUpdateExercise: (exercise: Exercise) => void;
  onCancel: () => void;
}

export function TrainingEntryView({
  exercise,
  currentSession,
  allSessions,
  defaultSets,
  selectedDate,
  onComplete,
  onUpdate,
  onUpdateExercise,
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

  // Determine initial weight: prioritize suggested weight from exercise over actual last weight
  const getInitialWeight = () => {
    if (existingEntry?.sets[0]?.weight) {
      return existingEntry.sets[0].weight;
    }
    if (exercise.suggestedWeight && exercise.suggestedWeight > 0) {
      return exercise.suggestedWeight;
    }
    if (previousTraining?.lastWeight) {
      return previousTraining.lastWeight;
    }
    return 10;
  };

  // State for weight (shared by both sets) and reps for each set
  const [weight, setWeight] = useState(getInitialWeight());
  const [repsSet1, setRepsSet1] = useState(
    existingEntry?.sets[0]?.reps || previousTraining?.lastReps || 10
  );
  const [repsSet2, setRepsSet2] = useState(
    existingEntry?.sets[1]?.reps || previousTraining?.lastReps || 10
  );

  // State for weight suggestion for next training
  const [suggestedWeight, setSuggestedWeight] = useState(
    exercise.suggestedWeight && exercise.suggestedWeight > 0
      ? exercise.suggestedWeight
      : weight
  );

  const handleComplete = () => {
    const sets: TrainingSet[] = [
      { setNumber: 1, weight, reps: repsSet1 },
      { setNumber: 2, weight, reps: repsSet2 },
    ];

    const entry: TrainingEntry = {
      id: existingEntry?.id || `${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      date: selectedDate,
      sets,
    };

    // Update exercise with suggested weight if provided
    if (suggestedWeight > 0) {
      onUpdateExercise({
        ...exercise,
        suggestedWeight: suggestedWeight,
      });
    }

    // Complete the entry
    onComplete(entry, selectedDate);
  };

  const handleDelete = () => {
    if (!existingEntry) return;

    const entry: TrainingEntry = {
      id: existingEntry.id,
      exerciseId: exercise.id,
      date: selectedDate,
      sets: [],
    };

    onUpdate(entry, selectedDate);
    onCancel();
  };

  const handleSkip = () => {
    const entry: TrainingEntry = {
      id: existingEntry?.id || `${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      date: selectedDate,
      sets: [],
      skipped: true,
    };

    onComplete(entry, selectedDate);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b-2 border-border">
        <div className="p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-9 px-3"
              data-testid="back-button"
            >
              <ArrowLeft size={18} className="mr-1" />
              Zurück
            </Button>
            {existingEntry && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="h-9 w-9 p-0"
                data-testid="delete-entry-button"
              >
                <Trash size={18} weight="bold" />
              </Button>
            )}
          </div>

          <div className="mb-2 flex gap-3">
            <BodyPartIconComponent
              exerciseName={exercise.name}
              size={36}
              className="text-primary shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">{exercise.name}</h1>
              <p className="text-sm text-muted-foreground line-clamp-2 h-5">
                {exercise.notes || ""}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {previousTraining && (
              <div className="text-sm text-muted-foreground">
                Vorher: {previousTraining.lastWeight}kg ×{" "}
                {previousTraining.lastReps}
              </div>
            )}
            {exercise.suggestedWeight && (
              <div className="text-sm text-primary font-semibold">
                Vorschlag: {exercise.suggestedWeight}kg
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-4 pb-32">
        <div>
          <label className="text-sm font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
            Gewicht
          </label>

          <WeightInput value={weight} onChange={setWeight} size="large" />
        </div>

        <div className="border-t border-border my-4"></div>

        <SetInput setNumber={1} reps={repsSet1} onRepsChange={setRepsSet1} />

        <SetInput setNumber={2} reps={repsSet2} onRepsChange={setRepsSet2} />

        <div className="border-t border-border my-4"></div>

        <div>
          <label className="text-sm font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
            Gewicht für nächstes Mal
          </label>

          <WeightInput
            value={suggestedWeight}
            onChange={setSuggestedWeight}
            size="small"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t border-border">
        <div className="flex gap-3">
          <Button
            size="lg"
            variant="outline"
            className="h-24 px-8"
            onClick={handleSkip}
            data-testid="skip-exercise-button"
          >
            <XCircle size={24} weight="bold" className="text-red-500" />
          </Button>
          <Button
            size="lg"
            className="flex-1 h-24 text-lg font-bold"
            onClick={handleComplete}
            data-testid="complete-exercise-button"
          >
            <Check size={24} weight="bold" className="mr-2" />
            Übung abschließen
          </Button>
        </div>
      </div>
    </div>
  );
}
