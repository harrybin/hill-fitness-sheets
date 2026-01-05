import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Exercise } from "@/lib/types";
import { ExerciseList } from "@/components/ExerciseList";
import { TrainingEntryView } from "@/components/TrainingEntryView";
import { SessionHeader } from "@/components/SessionHeader";
import { SettingsDialog } from "@/components/SettingsDialog";
import { AboutDialog } from "@/components/AboutDialog";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { Toaster } from "@/components/ui/sonner";
import { Gear, DotsThreeVertical, Info } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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

  const today = new Date().toISOString().split("T")[0];
  const viewDate = selectedDate || today;
  const currentSession = sessions.find((s) => s.date === viewDate);

  const handleCompleteEntry = (entry: any, date: string) => {
    completeEntry(entry, date);
    setSelectedExercise(null);
  };

  const handleCancelEntry = () => {
    setSelectedExercise(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-6">
      <Toaster />
      <PWAInstallBanner />

      <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center justify-between p-3">
            <SessionHeader
              session={currentSession}
              allSessions={sessions}
              selectedDate={viewDate}
              onSelectSession={(date) => {
                setSelectedDate(date);
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => setSettingsOpen(true)}
                  className="flex items-center gap-2"
                  data-testid="settings-menu-item"
                >
                  <Gear size={18} /> Einstellungen
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setAboutOpen(true)}
                  className="flex items-center gap-2"
                  data-testid="about-menu-item"
                >
                  <Info size={18} /> Über
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="pb-20">
          {selectedExercise ? (
            <TrainingEntryView
              exercise={selectedExercise}
              currentSession={currentSession}
              allSessions={sessions}
              defaultSets={2}
              selectedDate={viewDate}
              onComplete={handleCompleteEntry}
              onUpdate={updateEntry}
              onUpdateExercise={updateExercise}
              onCancel={handleCancelEntry}
            />
          ) : (
            <ExerciseList
              exercises={exercises}
              currentSession={currentSession}
              allSessions={sessions}
              onSelectExercise={setSelectedExercise}
              selectedDate={viewDate}
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
