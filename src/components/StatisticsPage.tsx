import React from "react";
import { useApp } from "@/contexts/AppContext";
import { StatsDashboard } from "./StatsDashboard";
import { Button } from "@/components/ui/button";

export default function StatisticsPage() {
  const { sessions, exercises } = useApp();
  // Handler für Zurück-Button
  const handleBack = () => {
    window.location.hash = "";
  };
  // Importiere Button-Komponente
  // ...existing code...
  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg shadow-lg overflow-hidden relative">
        <div className="absolute right-4 top-4 z-10">
          <Button
            onClick={handleBack}
            variant="outline"
            size="default"
            className="gap-1.5 text-sm h-10"
          >
            ← Zurück
          </Button>
        </div>
        <StatsDashboard sessions={sessions} exercises={exercises} />
      </div>
    </div>
  );
}
