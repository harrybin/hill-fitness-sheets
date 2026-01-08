import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { XLSXImportSection } from "./XLSXImportSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileArrowDown, DownloadSimple, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
// import QRCodeSVG from "react-qr-code";
import { arrayBufferToBase64, exportXLSXWithFormatting } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  exerciseCount: number;
  sessionCount: number;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setSettings, loadFromXLSX, sessions, exercises } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleImport = async (arrayBuffer: ArrayBuffer, fileName: string) => {
    const result = await loadFromXLSX(arrayBuffer);

    const fileData = arrayBufferToBase64(arrayBuffer);

    setSettings((prev) => ({
      ...prev,
      importedFile: {
        name: fileName,
        data: fileData,
        lastModified: Date.now(),
        size: arrayBuffer.byteLength,
      },
    }));

    onOpenChange(false);

    return result;
  };

  const exportStoredFile = async () => {
    if (!settings.importedFile) {
      toast.error("Keine Datei", {
        description: "Bitte zuerst eine XLSX-Datei importieren",
      });
      return;
    }

    try {
      // Export with formatting preservation
      const arrayBuffer = await exportXLSXWithFormatting(
        settings.importedFile.data,
        sessions,
        exercises
      );

      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = settings.importedFile.name;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Exportiert", {
        description: `${settings.importedFile.name}`,
        icon: <DownloadSimple size={20} weight="fill" />,
      });
    } catch (error) {
      toast.error("Export fehlgeschlagen", {
        description:
          error instanceof Error ? error.message : "Fehler beim Export",
      });
    }
  };

  const handleClearApp = () => {
    try {
      localStorage.clear();
      toast.success("App geleert", {
        description: "Alle Daten wurden gelöscht",
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("Fehler beim Leeren", {
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>
        <div className="bg-muted/50 p-2.5 rounded-md space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Google Sheets Datei</Label>
            <div className="space-y-2">
              <XLSXImportSection
                onImport={handleImport}
                showLocalUpload={true}
              />

              {settings.importedFile && (
                <div className="bg-muted/50 p-2.5 rounded-md space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {settings.importedFile.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {new Date(
                          settings.importedFile.lastModified
                        ).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })}{" "}
                        • {(settings.importedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={exportStoredFile}
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs h-8"
                    data-testid="export-xlsx-button"
                  >
                    <DownloadSimple size={14} />
                    Export
                  </Button>
                  <Separator className="my-6" />
                  <div className="text-sm font-semibold text-foreground truncate">
                    App Daten
                  </div>
                  <Button
                    onClick={() => setShowClearConfirm(true)}
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
                    data-testid="clear-cache-button"
                  >
                    <Trash size={14} />
                    App Cache leeren
                  </Button>
                </div>
              )}
            </div>
          </div>

          {(settings.trainingGoal ||
            settings.legalNotice ||
            settings.notes) && (
            <>
              <Separator />

              <div className="space-y-2">
                <Label className="text-sm">Informationen</Label>
                <div className="space-y-2 text-sm bg-muted/50 p-2.5 rounded-md max-h-32 overflow-y-auto">
                  {settings.trainingGoal && (
                    <div>
                      <div className="font-semibold text-foreground text-xs">
                        Ziel:
                      </div>
                      <div className="text-muted-foreground text-xs mt-0.5 leading-tight wrap-break-word">
                        {settings.trainingGoal}
                      </div>
                    </div>
                  )}
                  {settings.legalNotice && (
                    <div className="mt-2">
                      <div className="font-semibold text-foreground text-xs">
                        Hinweise:
                      </div>
                      <div className="text-muted-foreground text-xs mt-0.5 leading-tight wrap-break-word">
                        {settings.legalNotice}
                      </div>
                    </div>
                  )}
                  {settings.notes && (
                    <div className="mt-2">
                      <div className="font-semibold text-foreground text-xs">
                        Notizen:
                      </div>
                      <div className="text-muted-foreground text-xs mt-0.5 leading-tight wrap-break-word">
                        {settings.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Über-Abschnitt entfernt, jetzt eigenes Dialog */}
        </div>
      </DialogContent>

      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>App wirklich leeren?</DialogTitle>
            <DialogDescription>
              Alle gespeicherten Übungen, Trainingseinheiten und Einstellungen
              werden unwiderruflich gelöscht. Die App wird danach neu geladen.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-2.5 rounded-md">
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setShowClearConfirm(false)}
                variant="outline"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleClearApp}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Alle Daten löschen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
