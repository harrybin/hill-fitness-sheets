import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import QRCodeSVG from "react-qr-code";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Über</DialogTitle>
          <DialogDescription>
            Informationen zu Hill Fitness Sheets, Version und Autor
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/50 p-2.5 rounded-md space-y-3">
          <div className="text-xs bg-background/80 border border-border rounded p-2 mb-2">
            <span className="font-semibold">Trainingsstatistiken:</span> Die App
            zeigt dir automatisch Statistiken zu Trainingshäufigkeit,
            Fortschritt und Bestleistungen an. Alle Auswertungen erfolgen
            offline auf deinem Gerät – deine Daten bleiben privat. Die
            Statistiken helfen dir, Motivation und Fortschritt im Blick zu
            behalten.
          </div>
          <div className="space-y-1.5">
            <div className="text-xs">
              <span className="font-semibold text-foreground">Version: </span>
              <span className="text-muted-foreground font-mono">
                {import.meta.env.VITE_APP_VERSION}.
                {import.meta.env.VITE_GIT_COMMIT_HASH || "dev"}
              </span>
              {import.meta.env.VITE_BUILD_DATE && (
                <span className="text-muted-foreground/70 ml-1">
                  •{" "}
                  {new Date(import.meta.env.VITE_BUILD_DATE).toLocaleDateString(
                    "de-DE",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    }
                  )}
                </span>
              )}
            </div>
            <div className="text-xs">
              <span className="font-semibold text-foreground">Autor: </span>
              <span className="text-muted-foreground">Harald Binkle</span>
            </div>
            <div className="text-xs">
              <span className="font-semibold text-foreground">Lizenz: </span>
              <span className="text-muted-foreground">
                MIT (kostenlos frei verfügbar)
              </span>
            </div>
            <div className="text-xs">
              <span className="font-semibold text-foreground">Quellcode: </span>
              <a
                href="https://github.com/harrybin/hill-fitness-sheets"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                GitHub
              </a>
            </div>
            <div className="text-xs">
              <span className="font-semibold text-foreground">Download: </span>
              <a
                href="https://hill-fitness.harrybin.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                https://hill-fitness.harrybin.de/
              </a>
            </div>
          </div>
          <div className="flex justify-center pt-1">
            <div className="bg-white p-2 rounded-md">
              <QRCodeSVG
                value="https://hill-fitness.harrybin.de/"
                size={128}
                level="M"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
