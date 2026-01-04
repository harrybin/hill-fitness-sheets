import { Exercise } from "@/lib/types";
import { BaseExerciseCard } from "./BaseExerciseCard";
import { WeightChangeIndicator } from "./WeightChangeIndicator";

interface IncompleteExerciseCardProps {
  exercise: Exercise;
  lastWeight?: number;
  isOldSession?: boolean;
  onSelect: (exercise: Exercise) => void;
}

export function IncompleteExerciseCard({
  exercise,
  lastWeight,
  isOldSession,
  onSelect,
}: IncompleteExerciseCardProps) {
  return (
    <BaseExerciseCard
      exercise={exercise}
      isCompleted={false}
      isOldSession={isOldSession}
      onSelect={onSelect}
    >
      {lastWeight !== undefined && (
        <div className="absolute top-4 right-4 text-right">
          <div className="text-base text-foreground font-mono font-bold">
            {lastWeight}kg
          </div>
          {exercise.suggestedWeight && (
            <WeightChangeIndicator
              suggestedWeight={exercise.suggestedWeight}
              currentWeight={lastWeight}
              className="justify-end mt-1"
            />
          )}
        </div>
      )}
    </BaseExerciseCard>
  );
}
