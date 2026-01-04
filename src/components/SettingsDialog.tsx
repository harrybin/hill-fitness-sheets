import { useRef } from "react";
import { useApp } from "@/contexts/AppContext";
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
  Plus,
  Minus,
  FileArrowDown,
  FileXls,
  ArrowsClockwise,
  DownloadSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { base64ToArrayBuffer, arrayBufferToBase64 } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setSettings, loadFromXLSX } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustSets = (delta: number) => {
    setSettings((prev) => ({
      ...prev,
      defaultSetsPerExercise: Math.max(
        1,
        Math.min(10, prev.defaultSetsPerExercise + delta)
      ),
    }));
  };

  const exportStoredFile = () => {
    if (!settings.importedFile) {
      toast.error("Keine Datei", {
        description: "Bitte zuerst eine XLSX-Datei importieren",
      });
      return;
    }

    try {
      const arrayBuffer = base64ToArrayBuffer(settings.importedFile.data);
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

  const resyncFromStoredFile = () => {
    if (!settings.importedFile) {
      toast.error("Keine Datei", {
        description: "Bitte zuerst eine XLSX-Datei importieren",
      });
      return;
    }

    try {
      const arrayBuffer = base64ToArrayBuffer(settings.importedFile.data);
      loadFromXLSX(arrayBuffer);

      toast.success("Neu synchronisiert", {
        icon: <ArrowsClockwise size={20} weight="fill" />,
      });
    } catch (error) {
      toast.error("Sync fehlgeschlagen", {
        description:
          error instanceof Error ? error.message : "Fehler beim Laden",
      });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();

      loadFromXLSX(arrayBuffer);

      const fileData = arrayBufferToBase64(arrayBuffer);

      setSettings((prev) => ({
        ...prev,
        importedFile: {
          name: file.name,
          data: fileData,
          lastModified: file.lastModified,
          size: file.size,
        },
      }));

      toast.success("Importiert", {
        description: file.name,
        icon: <FileArrowDown size={20} weight="fill" />,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Import fehlgeschlagen", {
        description:
          error instanceof Error ? error.message : "Ungültiges Format",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Einstellungen</DialogTitle>
          <DialogDescription className="text-xs">
            Trainingseinstellungen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="space-y-2">
            <Label htmlFor="default-sets" className="text-sm">
              Standard-Sätze
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustSets(-1)}
                disabled={settings.defaultSetsPerExercise <= 1}
                className="h-10 w-10"
              >
                <Minus size={18} />
              </Button>

              <div className="flex-1 text-center">
                <div className="text-2xl font-bold font-mono text-primary">
                  {settings.defaultSetsPerExercise}
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustSets(1)}
                disabled={settings.defaultSetsPerExercise >= 10}
                className="h-10 w-10"
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Übungen</Label>
            <div className="space-y-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full justify-start gap-2 h-auto py-2.5"
              >
                <FileXls size={20} className="shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-sm">XLSX hochladen</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    Excel/Google Sheets Datei
                  </div>
                </div>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.ods"
                onChange={handleFileUpload}
                className="hidden"
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
                  <div className="flex gap-2">
                    <Button
                      onClick={resyncFromStoredFile}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs h-8"
                    >
                      <ArrowsClockwise size={14} />
                      Sync
                    </Button>
                    <Button
                      onClick={exportStoredFile}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs h-8"
                    >
                      <DownloadSimple size={14} />
                      Export
                    </Button>
                  </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
