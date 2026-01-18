import { Exercise, TrainingEntry } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { BaseExerciseCard } from "./BaseExerciseCard";
import { WeightChangeIndicator } from "./WeightChangeIndicator";

interface CompletedExerciseCardProps {
  exercise: Exercise;
  entry: TrainingEntry;
  isOldSession?: boolean;
  onSelect: (exercise: Exercise) => void;
}

export function CompletedExerciseCard({
  exercise,
  entry,
  isOldSession,
  onSelect,
}: CompletedExerciseCardProps) {
  const statusIcon = entry.skipped ? (
    <>
      <XCircle size={20} weight="fill" className="text-red-500 shrink-0" />
      <Badge variant="outline" className="text-muted-foreground">
        Übersprungen
      </Badge>
    </>
  ) : (
    <CheckCircle size={20} weight="fill" className="text-green-500 shrink-0" />
  );

  return (
    <BaseExerciseCard
      exercise={exercise}
      isCompleted={true}
      isOldSession={isOldSession}
      onSelect={onSelect}
      statusIcon={statusIcon}
    >
      {!entry.skipped && (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono font-bold text-base">
            {entry.sets[0]?.weight}kg
          </span>
          <span className="text-muted-foreground">|</span>
          {entry.sets.map((set, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                # {set.setNumber}
              </Badge>
              <span className="font-mono font-bold text-base">{set.reps}</span>
            </div>
          ))}
          {exercise.suggestedWeight && entry.sets[0]?.weight && (
            <>
              <span className="text-muted-foreground">|</span>
              <WeightChangeIndicator
                suggestedWeight={exercise.suggestedWeight}
                currentWeight={entry.sets[0].weight}
                size={18}
              />
            </>
          )}
        </div>
      )}
    </BaseExerciseCard>
  );
}
