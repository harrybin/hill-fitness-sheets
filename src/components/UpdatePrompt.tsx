import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { toast } from "sonner";

export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("Service Worker registriert");
      // Check for updates every hour
      r &&
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error("Service Worker Registrierung fehlgeschlagen:", error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success("App ist bereit für Offline-Nutzung", {
        duration: 3000,
      });
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <Card className="w-full max-w-md pointer-events-auto shadow-lg border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-lg">Neue Version verfügbar</CardTitle>
          <CardDescription>
            Eine aktualisierte Version der App wurde gefunden. Möchten Sie jetzt
            aktualisieren?
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleDismiss}>
            Später
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Jetzt aktualisieren
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
