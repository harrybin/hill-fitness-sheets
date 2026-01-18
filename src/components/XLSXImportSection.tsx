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
import {
  initGoogleAuth,
  requestGoogleAuth,
  downloadFileFromDrive,
  loadToken,
  saveToken,
  clearToken,
  type GoogleAuthToken,
} from "@/lib/googleAuth";

interface XLSXImportSectionProps {
  onImport: (
    arrayBuffer: ArrayBuffer,
    fileName: string,
    googleSheetUrl?: string,
    options?: {
      authenticated?: boolean;
      source?: "drive-api" | "public-download";
    },
  ) => void | Promise<void | { exerciseCount: number; sessionCount: number }>;
  showLocalUpload?: boolean;
  className?: string;
  initialDriveUrl?: string;
}

export function XLSXImportSection({
  onImport,
  showLocalUpload = true,
  className = "",
  initialDriveUrl = "",
}: XLSXImportSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [driveUrl, setDriveUrl] = useState(initialDriveUrl || "");
  const [isDownloading, setIsDownloading] = useState(false);
  const [googleToken, setGoogleToken] = useState<GoogleAuthToken | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
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
      const result = await onImport(arrayBuffer, file.name);

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

      // Try Google Drive API if authenticated
      if (googleToken) {
        try {
          const arrayBuffer = await downloadFileFromDrive(
            fileId,
            googleToken.access_token,
          );
          const fileName = `sheet_${new Date().getTime()}.xlsx`;

          const result = await onImport(arrayBuffer, fileName, driveUrl, {
            authenticated: true,
            source: "drive-api",
          });

          if (result && "exerciseCount" in result && "sessionCount" in result) {
            toast.success(
              `Importiert: ${result.sessionCount} Trainings / ${result.exerciseCount} Übungen (Drive API)`,
              {
                description: fileName,
              },
            );
          } else {
            toast.success("Erfolgreich importiert (Drive API)", {
              description: fileName,
            });
          }

          setDriveUrl("");
          return;
        } catch (driveError) {
          console.error("Drive API failed, trying fallback:", driveError);
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

      const result = await onImport(arrayBuffer, fileName, driveUrl, {
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
    } catch (error) {
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
      {!googleToken ? (
        <Button
          onClick={handleGoogleAuth}
          disabled={isAuthenticating}
          variant="outline"
          className="gap-2 w-full"
        >
          <GoogleLogo size={20} />
          {isAuthenticating ? "Anmeldung..." : "Mit Google anmelden (optional)"}
        </Button>
      ) : (
        <div className="flex gap-2 justify-center">
          <Button
            onClick={handleGoogleSignOut}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <GoogleLogo size={16} />
            Abmelden
          </Button>
          <span className="text-xs text-muted-foreground flex items-center">
            ✓ Angemeldet
          </span>
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center">
        Wenn Sie sich nicht anmelden, kann der Link dennoch eingefügt werden,
        dann wird der Download über den Browser statt in der App erfolgen und
        die Datei kann danach manuell als lokale XLSX Datei importiert werden.
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
