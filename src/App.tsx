import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Exercise } from "@/lib/types";
import { ExerciseList } from "@/components/ExerciseList";
import { TrainingEntryView } from "@/components/TrainingEntryView";
import { SessionHistory } from "@/components/SessionHistory";
import { toISODate } from "@/lib/utils";
import { SettingsDialog } from "@/components/SettingsDialog";
import { AboutDialog } from "@/components/AboutDialog";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { Toaster } from "@/components/ui/sonner";
import {
  Gear,
  DotsThreeVertical,
  Info,
  ChartLine,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function App() {
  const {
    exercises,
    sessions,
    settings,
    completeEntry,
    updateEntry,
    updateExercise,
  } = useApp();

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const today = new Date().toISOString().split("T")[0];
  const selectedDateClean = toISODate(selectedDate || today);
  const currentSession = sessions.find((s) => s.date === selectedDateClean);

  const handleCompleteEntry = (entry: any, date: string) => {
    completeEntry(entry, date);
    setSelectedExercise(null);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setScrollPosition(typeof window !== "undefined" ? window.scrollY : 0);
    setSelectedExercise(exercise);
  };

  useEffect(() => {
    if (!selectedExercise && typeof window !== "undefined") {
      window.scrollTo({ top: scrollPosition, behavior: "auto" });
    }
  }, [selectedExercise, scrollPosition]);

  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-6">
      <Toaster />
      <PWAInstallBanner />
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center justify-between p-3">
            <SessionHistory
              session={currentSession}
              allSessions={sessions}
              selectedDate={selectedDateClean}
              onSelectSession={(date) => {
                setSelectedDate(toISODate(date));
                setSelectedExercise(null);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Mehr"
                  data-testid="more-menu-button"
                >
                  <DotsThreeVertical
                    size={28}
                    color="currentColor"
                    weight="bold"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="left">
                <DropdownMenuItem
                  onSelect={() => (window.location.hash = "#/statistiken")}
                  className="flex items-center gap-2 px-4 py-2 text-base"
                  data-testid="statistics-menu-item"
                >
                  <ChartLine size={20} weight="bold" className="size-5" />{" "}
                  Statistiken
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setSettingsOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-base"
                  data-testid="settings-menu-item"
                >
                  <Gear size={20} weight="bold" className="size-5" />{" "}
                  Einstellungen
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setAboutOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-base"
                  data-testid="about-menu-item"
                >
                  <Info size={20} weight="bold" className="size-5" /> Über
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="pb-20">
          {selectedExercise ? (
            <TrainingEntryView
              exercise={selectedExercise as Exercise}
              currentSession={currentSession}
              allSessions={sessions}
              defaultSets={2}
              selectedDate={selectedDateClean}
              onComplete={handleCompleteEntry}
              onUpdate={updateEntry}
              onUpdateExercise={updateExercise}
              onCancel={() => setSelectedExercise(null)}
            />
          ) : (
            <ExerciseList
              exercises={exercises}
              currentSession={currentSession}
              allSessions={sessions}
              onSelectExercise={handleSelectExercise}
              selectedDate={selectedDateClean}
            />
          )}
        </div>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}

export default App;
