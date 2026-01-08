import { ReactNode } from "react";
import { Exercise } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BodyPartIconComponent } from "@/lib/useBodyPartIcon";

interface BaseExerciseCardProps {
  exercise: Exercise;
  isCompleted?: boolean;
  isOldSession?: boolean;
  onSelect: (exercise: Exercise) => void;
  statusIcon?: ReactNode;
  children?: ReactNode;
}

export function BaseExerciseCard({
  exercise,
  isCompleted,
  isOldSession,
  onSelect,
  statusIcon,
  children,
}: BaseExerciseCardProps) {
  return (
    <Card
      onClick={() => onSelect(exercise)}
      className={cn(
        "relative p-4 cursor-pointer transition-all active:scale-[0.98]",
        "hover:border-primary/50",
        isCompleted && "bg-card/50 border-primary/30",
        isOldSession && "bg-amber-950/20 border-amber-900/30"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 flex-1 min-w-0">
          <BodyPartIconComponent
            exerciseName={exercise.name}
            size={28}
            className="text-primary shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold truncate">{exercise.name}</h3>
              {statusIcon}
            </div>

            <p className="text-sm text-muted-foreground mb-2 line-clamp-2 h-5">
              {exercise.notes || ""}
            </p>

            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}
