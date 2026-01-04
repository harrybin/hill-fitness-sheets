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
import { FileArrowDown, FileXls, DownloadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import QRCodeSVG from "react-qr-code";
import {
  base64ToArrayBuffer,
  arrayBufferToBase64,
  exportXLSXWithFormatting,
} from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setSettings, loadFromXLSX, sessions, exercises } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportStoredFile = () => {
    if (!settings.importedFile) {
      toast.error("Keine Datei", {
        description: "Bitte zuerst eine XLSX-Datei importieren",
      });
      return;
    }

    try {
      // Export with formatting preservation
      const arrayBuffer = exportXLSXWithFormatting(
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
            <Label className="text-sm">Google Sheets Datei</Label>
            <div className="space-y-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full justify-start gap-2 h-auto py-2.5"
              >
                <FileXls size={20} className="shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-sm">XLSX importieren</div>
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
                  <Button
                    onClick={exportStoredFile}
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs h-8"
                  >
                    <DownloadSimple size={14} />
                    Export
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

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Über</Label>
            <div className="bg-muted/50 p-2.5 rounded-md space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs">
                  <span className="font-semibold text-foreground">
                    Version:{" "}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    1.0.{import.meta.env.VITE_GIT_COMMIT_HASH || "dev"}
                  </span>
                  {import.meta.env.VITE_BUILD_DATE && (
                    <span className="text-muted-foreground/70 ml-1">
                      •{" "}
                      {new Date(
                        import.meta.env.VITE_BUILD_DATE
                      ).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Autor: </span>
                  <span className="text-muted-foreground">Harald Binkle</span>
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-foreground">
                    Lizenz:{" "}
                  </span>
                  <span className="text-muted-foreground">
                    MIT (kostenlos frei verfügbar)
                  </span>
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-foreground">
                    Quellcode:{" "}
                  </span>
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
                  <span className="font-semibold text-foreground">
                    Download:{" "}
                  </span>
                  <a
                    href="https://hill-fitness.harrybin.de/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    hill-fitness.harrybin.de
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
