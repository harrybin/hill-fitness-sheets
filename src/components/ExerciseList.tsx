import { useRef, useState, useEffect } from "react";
import { Exercise, Session } from "@/lib/types";
import { Barbell, FileXls, Download, GoogleLogo } from "@phosphor-icons/react";
import { CompletedExerciseCard } from "./CompletedExerciseCard";
import { IncompleteExerciseCard } from "./IncompleteExerciseCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { arrayBufferToBase64 } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  initGoogleAuth,
  requestGoogleAuth,
  downloadFileFromDrive,
  loadToken,
  saveToken,
  clearToken,
  type GoogleAuthToken,
} from "@/lib/googleAuth";

interface ExerciseListProps {
  exercises: Exercise[];
  currentSession?: Session;
  allSessions?: Session[];
  onSelectExercise: (exercise: Exercise) => void;
  selectedDate?: string;
}

export function ExerciseList({
  exercises,
  currentSession,
  allSessions,
  onSelectExercise,
  selectedDate,
}: ExerciseListProps) {
  const { loadFromXLSX, setSettings } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [driveUrl, setDriveUrl] = useState("");
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
      });
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
            googleToken.access_token
          );
          const fileName = `sheet_${new Date().getTime()}.xlsx`;

          loadFromXLSX(arrayBuffer);

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

          toast.success("Erfolgreich importiert (Drive API)", {
            description: fileName,
          });

          setDriveUrl("");
          return;
        } catch (driveError) {
          console.error("Drive API failed, trying fallback:", driveError);
          // Token might be expired
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

      loadFromXLSX(arrayBuffer);

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

      toast.success("Erfolgreich importiert", {
        description: fileName,
      });

      setDriveUrl("");
    } catch (error) {
      // Fallback to browser download if all else fails
      const downloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `sheet_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const message = googleToken
        ? "Automatischer Import fehlgeschlagen. Browser-Download gestartet."
        : "Datei nicht öffentlich? Melden Sie sich mit Google an oder laden Sie manuell hoch.";

      toast.info("Download gestartet", {
        description: message,
        duration: 8000,
      });

      setDriveUrl("");
    } finally {
      setIsDownloading(false);
    }
  };

  const todayDateString = new Date().toISOString().split("T")[0];
  const isOldSession =
    selectedDate && selectedDate.replace(" ?", "").trim() !== todayDateString;
  const getExerciseStatus = (exerciseId: string) => {
    const entry = currentSession?.entries.find(
      (e) => e.exerciseId === exerciseId
    );
    if (!entry || (entry.sets.length === 0 && !entry.skipped)) {
      return undefined;
    }
    return entry;
  };

  const getLastWeight = (exerciseId: string): number | undefined => {
    if (!allSessions || allSessions.length === 0) return undefined;

    const today = new Date().toISOString().split("T")[0];
    const previousSessions = [...allSessions]
      .filter((s) => s.date !== today && s.entries && s.entries.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const session of previousSessions) {
      const entry = session.entries.find((e) => e.exerciseId === exerciseId);
      if (entry && entry.sets && entry.sets.length > 0) {
        const weights = entry.sets.map((s) => s.weight).filter((w) => w > 0);
        if (weights.length > 0) {
          const maxWeight = Math.max(...weights);
          return maxWeight;
        }
      }
    }

    return undefined;
  };

  const validExercises = exercises.filter(
    (ex) =>
      ex.name &&
      ex.name.trim() !== "" &&
      ex.name !== "undefined" &&
      ex.name.toLowerCase() !== "undefined"
  );

  if (validExercises.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <p className="text-muted-foreground mb-6 max-w-md text-sm ">
            Eine Progressive Web App zum Tracken von Trainingseinheiten im
            Fitnessstudio mit Offline-Funktionalität.
          </p>
          <Barbell size={64} className="text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Keine Übungen</h2>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            Importieren Sie Ihre Übungen aus dem Google Sheet von Hill-Fitness.
            (Dies kann jeder Zeit über die Einstellungen wiederholt werden.)
          </p>

          <div className="w-full max-w-md space-y-3">
            {!googleToken ? (
              <Button
                onClick={handleGoogleAuth}
                disabled={isAuthenticating}
                variant="outline"
                className="gap-2 w-full"
              >
                <GoogleLogo size={20} />
                {isAuthenticating
                  ? "Anmeldung..."
                  : "Mit Google anmelden (für private Dateien)"}
              </Button>
            ) : (
              <div className="flex gap-2">
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

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Google Drive Link einfügen..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleDriveDownload}
                disabled={isDownloading}
                variant="default"
                className="gap-2"
              >
                <Download size={20} />
                {isDownloading ? "Importiere..." : "Import"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {googleToken
                ? "Mit Google angemeldet - private Dateien werden unterstützt"
                : "Öffentliche Dateien oder mit Google anmelden für private Dateien"}
            </p>

            <div className="text-sm text-muted-foreground text-center">
              oder
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="gap-2 w-full"
              data-testid="import-xlsx-button"
            >
              <FileXls size={20} />
              Lokale XLSX Datei importieren
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.ods"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {validExercises.map((exercise) => {
        const entry = getExerciseStatus(exercise.id);
        const isCompleted = !!entry;
        const lastWeight = getLastWeight(exercise.id);

        return isCompleted ? (
          <CompletedExerciseCard
            key={exercise.id}
            exercise={exercise}
            entry={entry}
            isOldSession={isOldSession}
            onSelect={onSelectExercise}
          />
        ) : (
          <IncompleteExerciseCard
            key={exercise.id}
            exercise={exercise}
            lastWeight={lastWeight}
            isOldSession={isOldSession}
            onSelect={onSelectExercise}
          />
        );
      })}
    </div>
  );
}
