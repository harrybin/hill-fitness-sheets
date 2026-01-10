import { useState } from "react";
import { Session } from "@/lib/types";
import { Calendar, CalendarCheck } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, toISODate } from "@/lib/utils";

interface SessionHistoryProps {
  session?: Session;
  allSessions?: Session[];
  selectedDate?: string;
  onSelectSession?: (date: string) => void;
}

export function SessionHistory({
  session,
  allSessions,
  selectedDate,
  onSelectSession,
}: SessionHistoryProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const todayDateString = new Date().toISOString().split("T")[0];
  const currentDateString = selectedDate || todayDateString;
  const currentDateISO = toISODate(currentDateString);
  const isOldSession = currentDateISO !== todayDateString;

  // Check if current session has interpolated date
  const isCurrentSessionInterpolated = session?.dateInterpolated || false;

  const displayDate = (() => {
    const dateParts = currentDateString.split("-");
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const day = parseInt(dateParts[2]);
      const date = new Date(year, month, day);

      const formatted = date.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      // Add "?" only if session is interpolated
      return isCurrentSessionInterpolated ? formatted + " ?" : formatted;
    }
    return currentDateString;
  })();

  const completedCount = session?.entries.filter((e) => !e.skipped).length || 0;

  const previousSession = (allSessions || [])
    .filter((s) => {
      const hasEntries = s.entries && s.entries.length > 0;
      const isBeforeToday = toISODate(s.date) < currentDateISO;
      return hasEntries && isBeforeToday;
    })
    .sort((a, b) => toISODate(b.date).localeCompare(toISODate(a.date)))[0];

  let lastTrainingDate: string | null = null;

  if (previousSession?.date) {
    try {
      const dateParts = previousSession.date.split("-");
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        const date = new Date(year, month, day);

        lastTrainingDate = date.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    } catch (error) {
      console.error("Error parsing date:", error, previousSession.date);
    }
  }

  const formatDate = (dateString: string, isInterpolated?: boolean): string => {
    try {
      const dateParts = dateString.split("-");
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        const date = new Date(year, month, day);

        const formatted = date.toLocaleDateString("de-DE", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // Add "?" only if date is interpolated
        return isInterpolated ? formatted + " ?" : formatted;
      }
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
    }
    return dateString;
  };

  const sessionsWithEntries = (allSessions || [])
    .filter((s) => s.entries && s.entries.length > 0)
    .sort((a, b) => toISODate(b.date).localeCompare(toISODate(a.date)));

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 -m-3 p-3 rounded-lg transition-colors",
          isOldSession && "bg-amber-950/20"
        )}
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-transparent h-auto w-auto p-0"
              data-testid="calendar-dialog-button"
            >
              <Calendar
                size={48}
                weight="bold"
                className="text-primary size-12"
              />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {`Bisherige Trainings (${sessionsWithEntries.length})`}
              </DialogTitle>
              <DialogDescription>
                Wählen Sie ein Training aus der Liste, um es anzuzeigen
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              {sessionsWithEntries.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Keine Trainingseinheiten vorhanden
                </div>
              ) : (
                <div className="space-y-2">
                  {sessionsWithEntries.map((s) => (
                    <div
                      key={s.date}
                      onClick={() => {
                        if (onSelectSession) {
                          onSelectSession(s.date);
                          setDialogOpen(false);
                        }
                      }}
                      className={cn(
                        "bg-card border border-border rounded-lg p-4 transition-colors",
                        onSelectSession && "hover:bg-accent/50 cursor-pointer",
                        toISODate(selectedDate || "") === toISODate(s.date) &&
                          "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground">
                            {formatDate(s.date, s.dateInterpolated)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="text-xs text-muted-foreground">
                            Abgeschl. Übungen
                          </div>
                          <div className="text-lg font-mono font-bold text-primary">
                            {s.entries.filter((e) => !e.skipped).length}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-foreground leading-tight truncate">
            {displayDate}
          </div>
          <div className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
            {lastTrainingDate ? `Letztes: ${lastTrainingDate}` : "Letztes: ---"}
            {completedCount > 0 &&
              ` • ${completedCount} Übung${completedCount === 1 ? "" : "en"}`}
          </div>
        </div>
      </div>

      {isOldSession && onSelectSession && (
        <Button
          variant="outline"
          onClick={() => onSelectSession(todayDateString)}
          className="shrink-0 h-12 px-4 mt-1 text-lg"
          data-testid="today-button"
        >
          <CalendarCheck
            size={48}
            weight="bold"
            className="text-primary size-8"
          />
          Heute
        </Button>
      )}
    </>
  );
}
