import { Exercise, Session } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Barbell,
  XCircle,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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
        <p className="text-muted-foreground mb-4 max-w-md text-sm">
          Importieren Sie Ihre Trainingsübungen über die Einstellungen.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {validExercises.map((exercise) => {
        const entry = getExerciseStatus(exercise.id);
        const isCompleted = !!entry;
        const lastWeight = getLastWeight(exercise.id);

        return (
          <Card
            key={exercise.id}
            onClick={() => onSelectExercise(exercise)}
            className={cn(
              "p-4 cursor-pointer transition-all active:scale-[0.98]",
              "hover:border-primary/50",
              isCompleted && "bg-card/50 border-primary/30",
              isOldSession && "bg-amber-950/20 border-amber-900/30"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-lg font-bold truncate">
                    {exercise.name}
                  </h3>
                  {isCompleted &&
                    (entry?.skipped ? (
                      <>
                        <XCircle
                          size={20}
                          weight="fill"
                          className="text-red-500 shrink-0"
                        />
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Übersprungen
                        </Badge>
                      </>
                    ) : (
                      <CheckCircle
                        size={20}
                        weight="fill"
                        className="text-green-500 shrink-0"
                      />
                    ))}
                </div>

                {exercise.notes && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {exercise.notes}
                  </p>
                )}

                {entry && !entry.skipped && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-mono font-bold text-base">
                      {entry.sets[0]?.weight}kg
                    </span>
                    <span className="text-muted-foreground">|</span>
                    {entry.sets.map((set, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          Satz {set.setNumber}
                        </Badge>
                        <span className="font-mono font-bold text-base">
                          {set.reps}
                        </span>
                      </div>
                    ))}
                    {exercise.suggestedWeight &&
                      exercise.suggestedWeight !== entry.sets[0]?.weight && (
                        <>
                          <span className="text-muted-foreground">|</span>
                          {exercise.suggestedWeight > entry.sets[0]?.weight ? (
                            <ArrowUp
                              size={18}
                              weight="bold"
                              className="text-orange-500 shrink-0"
                            />
                          ) : (
                            <ArrowDown
                              size={18}
                              weight="bold"
                              className="text-blue-500 shrink-0"
                            />
                          )}
                          <span className="font-mono text-sm text-muted-foreground">
                            {exercise.suggestedWeight}kg
                          </span>
                        </>
                      )}
                  </div>
                )}
              </div>

              {!isCompleted && lastWeight !== undefined && (
                <div className="shrink-0 text-right">
                  <div className="text-base text-foreground font-mono font-bold">
                    {lastWeight}kg
                  </div>
                  {exercise.suggestedWeight &&
                    exercise.suggestedWeight !== lastWeight && (
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {exercise.suggestedWeight > lastWeight ? (
                          <ArrowUp
                            size={16}
                            weight="bold"
                            className="text-orange-500"
                          />
                        ) : (
                          <ArrowDown
                            size={16}
                            weight="bold"
                            className="text-blue-500"
                          />
                        )}
                        <span className="text-sm text-muted-foreground font-mono">
                          {exercise.suggestedWeight}kg
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
