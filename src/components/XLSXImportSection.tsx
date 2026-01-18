import { useRef, useState, useEffect } from "react";
import { FileXls, Download, GoogleLogo, Question } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { arrayBufferToBase64 } from "@/lib/utils";
import {
  initGoogleAuth,
  requestGoogleAuth,
  downloadFileFromDrive,
  fetchExercisesFromSheetsAPI,
  loadToken,
  saveToken,
  clearToken,
  type GoogleAuthToken,
} from "@/lib/googleAuth";

interface XLSXImportSectionProps {
  onAfterImport?: (result: {
    exerciseCount: number;
    sessionCount: number;
  }) => void;
  showLocalUpload?: boolean;
  className?: string;
  initialDriveUrl?: string;
}

export function XLSXImportSection({
  onAfterImport,
  showLocalUpload = true,
  className = "",
  initialDriveUrl = "",
}: XLSXImportSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [driveUrl, setDriveUrl] = useState(initialDriveUrl || "");
  const [isDownloading, setIsDownloading] = useState(false);
  const [googleToken, setGoogleToken] = useState<GoogleAuthToken | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { loadFromXLSX, setSettings } = useApp();

  // Centralized import + persistence logic
  const doImport = async (
    arrayBuffer: ArrayBuffer,
    fileName: string,
    googleSheetUrl?: string,
    options?: {
      authenticated?: boolean;
      source?: "drive-api" | "sheets-api" | "public-download";
    },
  ) => {
    const result = await loadFromXLSX(arrayBuffer);
    const fileData = arrayBufferToBase64(arrayBuffer);

    setSettings((prev) => {
      const { googleSheetUrl: legacySheetUrl, ...rest } = prev as Record<
        string,
        unknown
      >;
      const resolvedSheetUrl =
        googleSheetUrl ||
        (prev as any)?.googleSheetImportStatus?.url ||
        (legacySheetUrl as string | undefined);

      return {
        ...(rest as typeof prev),
        googleSheetImportStatus:
          googleSheetUrl || resolvedSheetUrl
            ? {
                url: googleSheetUrl || resolvedSheetUrl,
                authenticated:
                  options?.authenticated ??
                  (prev as any)?.googleSheetImportStatus?.authenticated ??
                  false,
                source:
                  options?.source ??
                  (prev as any)?.googleSheetImportStatus?.source,
                success: true,
                lastImportedAt: Date.now(),
              }
            : (prev as any)?.googleSheetImportStatus,
        importedFile: {
          name: fileName,
          data: fileData,
          lastModified: Date.now(),
          size: arrayBuffer.byteLength,
        },
      } as any;
    });

    if (onAfterImport) onAfterImport(result);
    return result;
  };
  useEffect(() => {
    // Load saved token
    const savedToken = loadToken();
    if (savedToken) {
      setGoogleToken(savedToken);
    }

    // Initialize Google Auth
    initGoogleAuth().catch((error) => {
      console.error("Google Auth initialization failed:", error);
    });
  }, []);

  useEffect(() => {
    setDriveUrl(initialDriveUrl || "");
  }, [initialDriveUrl]);

  const handleGoogleAuth = async () => {
    try {
      setIsAuthenticating(true);
      const token = await requestGoogleAuth();
      setGoogleToken(token);
      saveToken(token);
      toast.success("Mit Google angemeldet", {
        description: "Sie können jetzt private Dateien importieren",
      });
    } catch (error) {
      toast.error("Anmeldung fehlgeschlagen", {
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignOut = () => {
    clearToken();
    setGoogleToken(null);
    toast.info("Abgemeldet", {
      description: "Google Authentifizierung entfernt",
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await doImport(arrayBuffer, file.name);

      if (
        result &&
        typeof result === "object" &&
        "exerciseCount" in result &&
        "sessionCount" in result
      ) {
        toast.success(
          `Importiert: ${result.sessionCount} Trainings / ${result.exerciseCount} Übungen`,
          {
            description: file.name,
          },
        );
      } else {
        toast.success("Importiert", {
          description: file.name,
        });
      }
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

  const handleDriveDownload = async () => {
    if (!driveUrl.trim()) {
      toast.error("Fehler", {
        description: "Bitte geben Sie einen Google Drive Link ein",
      });
      return;
    }

    const fileIdMatch = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileIdMatch) {
      toast.error("Ungültiger Link", {
        description: "Kein gültiger Google Drive Link",
      });
      return;
    }

    const fileId = fileIdMatch[1];

    try {
      setIsDownloading(true);

      // Ensure authentication before attempting import
      let token = googleToken;
      if (!token) {
        try {
          setIsAuthenticating(true);
          token = await requestGoogleAuth();
          setGoogleToken(token);
          saveToken(token);
          toast.success("Mit Google angemeldet", {
            description: "Import wird gestartet...",
          });
        } catch (authError) {
          toast.error("Anmeldung erforderlich", {
            description:
              authError instanceof Error
                ? authError.message
                : "Google Authentifizierung erforderlich für privaten Import",
          });
          setIsAuthenticating(false);
          setIsDownloading(false);
          return;
        } finally {
          setIsAuthenticating(false);
        }
      }

      // Try Google Drive API if authenticated
      if (token) {
        try {
          let arrayBuffer: ArrayBuffer;
          let source: "drive-api" | "sheets-api" | "public-download" =
            "drive-api";

          // First, try Sheets API for native Google Sheets files (more direct)
          try {
            arrayBuffer = await fetchExercisesFromSheetsAPI(
              fileId,
              token.access_token,
            );
            source = "sheets-api";
            console.log("Successfully imported using Sheets API");
          } catch (sheetsError) {
            // Fallback to Drive API if Sheets API fails
            console.error("Sheets API failed, trying Drive API:", sheetsError);
            arrayBuffer = await downloadFileFromDrive(
              fileId,
              token.access_token,
            );
          }

          const fileName = `sheet_${new Date().getTime()}.xlsx`;

          const result = await doImport(arrayBuffer, fileName, driveUrl, {
            authenticated: true,
            source,
          });

          if (result && "exerciseCount" in result && "sessionCount" in result) {
            const apiLabel =
              source === "sheets-api" ? "(Sheets API)" : "(Drive API)";
            toast.success(
              `Importiert: ${result.sessionCount} Trainings / ${result.exerciseCount} Übungen ${apiLabel}`,
              {
                description: fileName,
              },
            );
          } else {
            const apiLabel =
              source === "sheets-api" ? "(Sheets API)" : "(Drive API)";
            toast.success(`Erfolgreich importiert ${apiLabel}`, {
              description: fileName,
            });
          }

          setDriveUrl("");
          return;
        } catch (driveError) {
          console.error("Google APIs failed, trying fallback:", driveError);
          // Keep the link visible after authenticated imports for quick re-sync
          if (
            driveError instanceof Error &&
            driveError.message.includes("401")
          ) {
            clearToken();
            setGoogleToken(null);
            toast.warning("Sitzung abgelaufen", {
              description: "Bitte erneut anmelden",
            });
          }
        }
      }

      // Try direct fetch for public files
      const downloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
      const response = await fetch(downloadUrl, {
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("Download fehlgeschlagen");
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileName = `sheet_${new Date().getTime()}.xlsx`;

      const result = await doImport(arrayBuffer, fileName, driveUrl, {
        authenticated: false,
        source: "public-download",
      });

      if (result && "exerciseCount" in result && "sessionCount" in result) {
        toast.success(
          `Importiert: ${result.sessionCount} Trainings / ${result.exerciseCount} Übungen`,
          {
            description: fileName,
          },
        );
      } else {
        toast.success("Erfolgreich importiert", {
          description: fileName,
        });
      }

      setDriveUrl("");
    } catch (_error) {
      // Fallback to browser download if all else fails
      const downloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
      // Keep link so user sees which sheet was used
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `sheet_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const message = googleToken
        ? "Automatischer Import fehlgeschlagen. Browser-Download gestartet."
        : "Importieren Sie die XLSX Datei nach dem Download manuell.";

      toast.info("Download gestartet", {
        description: message,
        duration: 8000,
      });

      setDriveUrl("");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-xs text-muted-foreground text-center">
        Wenn die Anmeldung bei Google für die App nicht möglich ist, wird der
        Download über den Browser statt in der App erfolgen und die Datei kann
        danach manuell als lokale XLSX Datei importiert werden.
      </p>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Google Drive Link einfügen..."
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
          className="flex-1 border-2 border-orange-500 focus:border-orange-600 focus:ring-orange-500/40"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 [&_svg]:size-6!"
              type="button"
            >
              <Question color="#ff8800" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">
                Wie bekomme ich den Link?
              </h4>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Öffne dein Hill-Fitness Google Sheet wie du es kennst</li>
                <li>
                  Im drei-Punkte Menü rechts oben findest du den Eintrag "Link
                  kopieren"
                  <img
                    src="/copy-sheet-link.png"
                    alt="Link kopieren im Google Sheets Menü"
                    className="mt-2 rounded border border-border w-[70%]"
                  />
                </li>
                <li>
                  Dann hier im Eingabefeld lange drücken und im Kontextmenü
                  "Einfügen" wählen
                </li>
                <li>Schließlich "Import" drücken</li>
              </ol>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex mt-2">
        <Button
          onClick={handleDriveDownload}
          disabled={isDownloading}
          variant="default"
          className="gap-2 w-full"
        >
          <Download size={20} />
          {isDownloading ? "Importiere..." : "Import/Download"}
          <GoogleLogo size={20} />
        </Button>
      </div>
      <div className="border-t mt-5 mb-5" /> {/* Separator/Divider */}
      {showLocalUpload && (
        <>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="gap-2 w-full"
            data-testid="import-xlsx-button"
          >
            <FileXls size={20} />
            Lokale XLSX Datei importieren
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.ods"
            onChange={handleFileUpload}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
