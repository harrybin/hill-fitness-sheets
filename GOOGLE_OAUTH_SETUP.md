# Google OAuth Setup für Hill Fitness Sheets

Diese Anleitung zeigt, wie Sie Google OAuth für den automatischen Import privater Google Drive Dateien einrichten.

## Schritt 1: Google Cloud Projekt erstellen

1. Öffnen Sie [Google Cloud Console](https://console.cloud.google.com/)
2. Klicken Sie oben links auf das Projekt-Dropdown
3. Klicken Sie auf **"Neues Projekt"**
4. Projektname: `Hill Fitness Sheets` (oder beliebig)
5. Klicken Sie auf **"Erstellen"**
6. Warten Sie bis das Projekt erstellt ist und wählen Sie es aus

## Schritt 2: Google Drive API aktivieren

1. Im linken Menü: **APIs & Dienste** → **Bibliothek**
2. Suchen Sie nach `Google Drive API`
3. Klicken Sie darauf und dann auf **"Aktivieren"**

## Schritt 3: OAuth-Zustimmungsbildschirm konfigurieren

1. Im linken Menü: **APIs & Dienste** → **OAuth-Zustimmungsbildschirm**
2. Wählen Sie **"Extern"** (für persönliche Nutzung)
3. Klicken Sie auf **"Erstellen"**

### App-Informationen:
- **App-Name**: `Hill Fitness Sheets`
- **Nutzer-Support-E-Mail**: Ihre E-Mail
- **App-Logo**: (optional)
- **Autorisierte Domains**: (leer lassen für localhost)
- **E-Mail-Adresse des Entwicklers**: Ihre E-Mail

4. Klicken Sie auf **"Speichern und fortfahren"**

### Bereiche (Scopes):
1. Klicken Sie auf **"Bereiche hinzufügen oder entfernen"**
2. Filtern Sie nach `drive.readonly`
3. Wählen Sie: **`../auth/drive.readonly`** (Nur-Lese-Zugriff auf Google Drive)
4. Klicken Sie auf **"Aktualisieren"**
5. Klicken Sie auf **"Speichern und fortfahren"**

### Testnutzer:
1. Klicken Sie auf **"Nutzer hinzufügen"**
2. Geben Sie Ihre Google E-Mail-Adresse ein (die Sie für den Import verwenden)
3. Klicken Sie auf **"Hinzufügen"**
4. Klicken Sie auf **"Speichern und fortfahren"**

## Schritt 4: OAuth Client ID erstellen

1. Im linken Menü: **APIs & Dienste** → **Anmeldedaten**
2. Klicken Sie oben auf **"+ Anmeldedaten erstellen"**
3. Wählen Sie **"OAuth-Client-ID"**

### Konfiguration:
- **Anwendungstyp**: `Webanwendung`
- **Name**: `Hill Fitness Sheets Web Client`

#### Autorisierte JavaScript-Ursprünge:
Klicken Sie auf **"URI hinzufügen"** und fügen Sie hinzu:
```
http://localhost:5000
http://localhost:5173
```

Für Produktion später hinzufügen:
```
https://ihre-domain.com
```

#### Autorisierte Weiterleitungs-URIs:
(Leer lassen - nicht benötigt für Token-basierte Auth)

4. Klicken Sie auf **"Erstellen"**

## Schritt 5: Client ID kopieren

1. Nach der Erstellung erscheint ein Dialog mit Ihrer **Client-ID**
2. Kopieren Sie die Client-ID (Format: `xxxxx.apps.googleusercontent.com`)
3. Sie können sie später auch unter **Anmeldedaten** finden

## Schritt 6: Environment Variable setzen

1. Erstellen Sie eine `.env` Datei im Projekt-Root:
```bash
# Im hill-fitness-sheets Ordner
VITE_GOOGLE_CLIENT_ID=IHRE_CLIENT_ID_HIER.apps.googleusercontent.com
```

2. Ersetzen Sie `IHRE_CLIENT_ID_HIER` mit Ihrer tatsächlichen Client ID

3. **Wichtig**: `.env` ist bereits in `.gitignore` und wird nicht committet

## Schritt 7: App testen

1. Starten Sie den Dev-Server neu:
```bash
npm run dev
```

2. Öffnen Sie `http://localhost:5000`

3. Wenn keine Übungen vorhanden sind:
   - Klicken Sie auf **"Mit Google anmelden"**
   - Wählen Sie Ihr Google-Konto
   - Akzeptieren Sie die Berechtigungen (Drive Nur-Lesen)
   - Fügen Sie einen privaten Google Drive Link ein
   - Klicken Sie auf **"Import"**

## Fehlerbehebung

### "VITE_GOOGLE_CLIENT_ID nicht konfiguriert"
- Überprüfen Sie, ob die `.env` Datei im Root-Ordner existiert
- Stellen Sie sicher, dass der Server neu gestartet wurde
- Überprüfen Sie die Schreibweise: `VITE_GOOGLE_CLIENT_ID`

### "Google Auth Script konnte nicht geladen werden"
- Überprüfen Sie Ihre Internetverbindung
- Überprüfen Sie, ob Browser-Erweiterungen (z.B. Privacy Badger) das Script blockieren

### "Diese App wurde nicht von Google bestätigt"
- Das ist normal für Apps im Test-Modus
- Klicken Sie auf **"Erweitert"** → **"Zu Hill Fitness Sheets wechseln (unsicher)"**
- Nur Sie (als Testnutzer) können die App nutzen

### "Token expired" / "401 Fehler"
- Der Token ist nach 1 Stunde abgelaufen
- Klicken Sie auf **"Abmelden"** und melden Sie sich erneut an

## Produktion (optional)

Für den öffentlichen Einsatz:

1. **OAuth-Zustimmungsbildschirm**: Ändern Sie von "Test" zu "Produktion"
2. **Google Überprüfung**: Beantragen Sie die Überprüfung Ihrer App
3. **Authorized Origins**: Fügen Sie Ihre Produktions-URL hinzu
4. **Environment Variable**: Setzen Sie `VITE_GOOGLE_CLIENT_ID` auf Ihrem Hosting-Service

## Sicherheitshinweise

- ✅ Client ID ist öffentlich sichtbar (kein Problem)
- ✅ Client Secret wird NICHT benötigt (token-basierte Auth)
- ✅ Nur Lese-Zugriff auf Drive
- ✅ Token wird lokal gespeichert (localStorage)
- ⚠️ Committen Sie niemals `.env` Dateien

## Support

Bei Problemen:
- [Google OAuth Dokumentation](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid)
- [Google Drive API Referenz](https://developers.google.com/drive/api/guides/about-sdk)
