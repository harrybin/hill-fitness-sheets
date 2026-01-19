import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { XLSXImportSection } from "./XLSXImportSection";
import { SyncProgressDialog } from "./SyncProgressDialog";
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
import {
  DownloadSimple,
  FileArrowUp,
  Trash,
  ArrowUpRight,
  GoogleLogo,
} from "@phosphor-icons/react";
import { toast } from "sonner";
// import QRCodeSVG from "react-qr-code";
import {
  exportXLSXWithFormatting,
  exportToGoogleSheetDirectly,
} from "@/lib/utils";
import {
  initGoogleAuth,
  loadToken,
  requestGoogleAuth,
  saveToken,
  clearToken,
  type GoogleAuthToken,
} from "@/lib/googleAuth";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Import result is handled within XLSXImportSection; optional after-import callback closes dialog

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setSettings, loadFromXLSX, sessions, exercises } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [exercisesProcessed, setExercisesProcessed] = useState(0);
  const [currentExercise, setCurrentExercise] = useState("");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalSessionsSync, setTotalSessionsSync] = useState(0);
  const [totalExercisesSync, setTotalExercisesSync] = useState(0);

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
        exercises,
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

  const uploadToGoogleSheet = async () => {
    const status = settings.googleSheetImportStatus;
    if (!status?.url || !status.authenticated || !status.success) {
      toast.error("Kein Google Sheet", {
        description: "Nur möglich nach authentifiziertem Google-Import",
      });
      return;
    }

    const match = status.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const spreadsheetId = match?.[1];
    if (!spreadsheetId) {
      toast.error("Ungültiger Link", {
        description: "Konnte die Sheet-ID nicht erkennen",
      });
      return;
    }

    const ensureToken = async (): Promise<GoogleAuthToken> => {
      let token = loadToken();
      if (!token) {
        await initGoogleAuth();
        token = await requestGoogleAuth();
        saveToken(token);
      }
      return token;
    };

    try {
      setShowSyncProgress(true);
      setExercisesProcessed(0);
      setSessionsCompleted(0);
      setCurrentExercise("");
      setTotalSessionsSync(0);
      setTotalExercisesSync(0);

      const token = await ensureToken();

      // Use Google Sheets API to directly write data to the spreadsheet with progress callback
      const syncResults = await exportToGoogleSheetDirectly({
        spreadsheetId,
        sessions,
        exercises,
        accessToken: token.access_token,
        onProgress: ({
          sessionIndex,
          totalSessions,
          exerciseIndex,
          totalExercises,
          exerciseName,
        }) => {
          setTotalSessionsSync(totalSessions);
          setTotalExercisesSync(totalExercises);
          setSessionsCompleted(sessionIndex + 1);
          setExercisesProcessed(exerciseIndex + 1);
          setCurrentExercise(exerciseName);
        },
      });

      setShowSyncProgress(false);

      // Build summary message
      const successCount = syncResults.successfulSessions.length;
      const failCount = syncResults.failedSessions.length;
      const partialCount = syncResults.partialExercises.length;

      let message = `${successCount} Sessions synchronisiert`;
      if (failCount > 0 || partialCount > 0) {
        if (failCount > 0) message += `, ${failCount} Sessions fehlgeschlagen`;
        if (partialCount > 0)
          message += `, ${partialCount} Übungen übersprungen`;

        toast.warning("Sync teilweise erfolgreich", {
          description: message,
        });

        // Log details about what failed
        if (failCount > 0) {
          console.warn("Fehlgeschlagene Sessions:", syncResults.failedSessions);
        }
        if (partialCount > 0) {
          console.warn("Übersprungene Übungen:", syncResults.partialExercises);
        }
      } else {
        toast.success("Sync erfolgreich abgeschlossen", {
          description: message,
        });
      }
    } catch (error) {
      setShowSyncProgress(false);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Konnte nicht zu Google Sheets schreiben";

      // If error mentions missing authorization, offer to re-authenticate
      if (errorMsg.includes("Berechtigung") || errorMsg.includes("403")) {
        toast.error("Re-Authentifizierung erforderlich", {
          description: errorMsg,
          action: {
            label: "Neu anmelden",
            onClick: async () => {
              try {
                setShowSyncProgress(true);
                clearToken();
                await initGoogleAuth();
                const newToken = await requestGoogleAuth();
                saveToken(newToken);

                // Retry the upload
                await exportToGoogleSheetDirectly({
                  spreadsheetId,
                  sessions,
                  exercises,
                  accessToken: newToken.access_token,
                });

                setShowSyncProgress(false);

                toast.success("Sync abgeschlossen", {
                  description:
                    "Daten wurden direkt in Google Sheets geschrieben",
                });
              } catch (retryError) {
                toast.error("Sync fehlgeschlagen", {
                  description:
                    retryError instanceof Error
                      ? retryError.message
                      : "Konnte nicht zu Google Sheets schreiben",
                });
              }
            },
          },
        });
      } else {
        toast.error("Sync fehlgeschlagen", {
          description: errorMsg,
        });
      }
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
          <DialogDescription>
            Verwalten Sie Ihre Trainings-Dateien und App-Daten
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/50 p-2.5 rounded-md space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Google Sheets Datei</Label>
            <div className="space-y-2">
              <XLSXImportSection
                onAfterImport={() => onOpenChange(false)}
                showLocalUpload={true}
                initialDriveUrl={
                  settings.googleSheetImportStatus?.url ||
                  (
                    settings as Record<string, unknown>
                  ).googleSheetUrl?.toString?.() ||
                  ""
                }
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
                          settings.importedFile.lastModified,
                        ).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })}{" "}
                        • {(settings.importedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={uploadToGoogleSheet}
                      variant="default"
                      size="sm"
                      className="gap-2 w-full"
                      disabled={
                        !settings.googleSheetImportStatus?.authenticated ||
                        !settings.googleSheetImportStatus?.url
                      }
                    >
                      <FileArrowUp size={14} />
                      Sync zurück
                      <GoogleLogo size={20} />
                    </Button>
                    <Button
                      onClick={() => {
                        const url = settings.googleSheetImportStatus?.url;
                        if (url) {
                          window.open(url, "_blank");
                        }
                      }}
                      variant="link"
                      size="sm"
                      className="gap-2 w-full "
                      disabled={
                        !settings.googleSheetImportStatus?.authenticated ||
                        !settings.googleSheetImportStatus?.url
                      }
                    >
                      <ArrowUpRight size={14} />
                      Öffnen
                      <GoogleLogo size={20} />
                    </Button>

                    <Separator className="my-6" />
                    <Button
                      onClick={exportStoredFile}
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs h-8"
                      data-testid="export-xlsx-button"
                    >
                      <DownloadSimple size={14} />
                      XLSX Export Lokal
                    </Button>
                  </div>
                  <Separator className="my-6" />
                  <div className="text-sm font-semibold text-foreground truncate">
                    App Daten
                  </div>
                  <Button
                    onClick={() => setShowClearConfirm(true)}
                    variant="destructive"
                    size="sm"
                    className="w-full gap-1.5"
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

      <SyncProgressDialog
        open={showSyncProgress}
        exercisesProcessed={exercisesProcessed}
        totalExercises={totalExercisesSync || exercises.length}
        currentExercise={currentExercise}
        sessionsCompleted={sessionsCompleted}
        totalSessions={totalSessionsSync || sessions.length}
      />
    </Dialog>
  );
}
