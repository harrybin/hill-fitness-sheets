import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, XCircle } from "@phosphor-icons/react";

interface SyncProgressDialogProps {
  open: boolean;
  exercisesProcessed: number;
  totalExercises: number;
  currentExercise: string;
  sessionsCompleted: number;
  totalSessions: number;
}

export function SyncProgressDialog({
  open,
  exercisesProcessed,
  totalExercises,
  currentExercise,
  sessionsCompleted,
  totalSessions,
}: SyncProgressDialogProps) {
  const overallProgress =
    totalSessions > 0
      ? ((sessionsCompleted - 1) * totalExercises + exercisesProcessed) /
        (totalSessions * totalExercises)
      : 0;

  return (
    <Dialog open={open}>
      <DialogContent className="w-96">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-orange-500 animate-spin" />
            Google Sheets wird synchronisiert
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overall progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gesamtfortschritt</span>
              <span className="font-medium">
                {Math.round(overallProgress * 100)}%
              </span>
            </div>
            <Progress value={overallProgress * 100} className="h-2" />
          </div>

          {/* Session progress */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} weight="fill" className="text-green-500" />
              <span className="text-muted-foreground">Session</span>
              <span className="font-medium">
                {sessionsCompleted} / {totalSessions}
              </span>
            </div>
          </div>

          {/* Exercise progress */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {exercisesProcessed < totalExercises ? (
                <Circle size={16} className="text-orange-500" />
              ) : (
                <CheckCircle
                  size={16}
                  weight="fill"
                  className="text-green-500"
                />
              )}
              <span className="text-muted-foreground">Übung</span>
              <span className="font-medium">
                {exercisesProcessed} / {totalExercises}
              </span>
            </div>
          </div>

          {/* Current exercise */}
          {currentExercise && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="text-muted-foreground mb-1">Aktuelle Übung:</p>
              <p className="font-medium truncate">{currentExercise}</p>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground">
            <p>
              Geschützte Zellen werden automatisch übersprungen (z.B. Übung 11)
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
