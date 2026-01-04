# Google Sheets Integration - Setup Guide

## 🔧 Google Cloud Projekt einrichten

### 1. Projekt erstellen
1. Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes
3. Notieren Sie die Projekt-ID

### 2. Google Sheets API aktivieren
1. Navigation → APIs & Services → Library
2. Suchen Sie nach "Google Sheets API"
3. Klicken Sie auf "Enable"

### 3. API Credentials erstellen

#### API Key (für Lese-Zugriffe)
1. Navigation → APIs & Services → Credentials
2. Klicken Sie auf "+ CREATE CREDENTIALS" → "API key"
3. Kopieren Sie den API Key
4. (Optional) Beschränken Sie den Key auf die Google Sheets API

#### OAuth 2.0 Client ID (für Schreib-Zugriffe)
1. Klicken Sie auf "+ CREATE CREDENTIALS" → "OAuth client ID"
2. Falls noch nicht geschehen: Konfigurieren Sie den OAuth consent screen
   - User Type: External
   - App name: "Gym Tracker" (oder Ihr Wunschname)
   - Support email: Ihre E-Mail
   - Scopes: Fügen Sie "../auth/spreadsheets" hinzu
3. Wählen Sie Application type: "Web application"
4. Name: "Gym Tracker Web Client"
5. Authorized JavaScript origins:
   - Entwicklung: `http://localhost:5173`
   - Produktion: Ihre Domain (z.B. `https://gym-tracker.example.com`)
6. Authorized redirect URIs:
   - Entwicklung: `http://localhost:5173`
   - Produktion: Ihre Domain
7. Klicken Sie auf "Create"
8. Kopieren Sie die Client ID

### 4. Environment Variables konfigurieren

Erstellen Sie eine `.env` Datei im Projekt-Root:

```bash
VITE_GOOGLE_API_KEY=AIzaSy...Ihr_API_Key
VITE_GOOGLE_CLIENT_ID=123456789-abcdef...apps.googleusercontent.com
```

## 📊 Google Spreadsheet vorbereiten

### Spreadsheet erstellen
1. Öffnen Sie [Google Sheets](https://sheets.google.com)
2. Erstellen Sie ein neues Spreadsheet
3. Benennen Sie es (z.B. "Gym Training")

### Sheet 1: "Übungen"
Erstellen Sie ein Sheet mit dem Namen **"Übungen"**

Spaltenstruktur:
| A (Übungsname) | B (Notizen - optional) |
|----------------|------------------------|
| Bankdrücken    | Brust                 |
| Kniebeugen     | Beine                 |
| Klimmzüge      | Rücken                |
| Schulterdrücken| Schultern             |
| Bizeps Curls   | Arme                  |

### Sheet 2: "Trainings"
Erstellen Sie ein leeres Sheet mit dem Namen **"Trainings"**

Dieses Sheet wird automatisch vom System gefüllt mit:
- Datum
- Übungsname
- Gewicht und Wiederholungen für jeden Satz

### Spreadsheet ID finden
1. Öffnen Sie Ihr Spreadsheet
2. Schauen Sie in die URL-Leiste
3. Die URL sieht so aus:
   ```
   https://docs.google.com/spreadsheets/d/1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P/edit#gid=0
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                         Dies ist Ihre Spreadsheet-ID
   ```
4. Kopieren Sie nur den markierten Teil

## 🎯 In der App konfigurieren

1. Starten Sie die App
2. Klicken Sie auf das Zahnrad-Symbol (Einstellungen)
3. Fügen Sie die Spreadsheet-ID ein
4. Klicken Sie auf den Sync-Button
5. Beim ersten Mal werden Sie zur Google-Anmeldung weitergeleitet
6. Erlauben Sie der App den Zugriff auf Ihre Spreadsheets
7. Die Übungen werden automatisch importiert

## 🔐 Berechtigungen

Die App benötigt folgende Berechtigungen:
- **Lesen**: Um Übungen aus dem "Übungen"-Sheet zu laden
- **Schreiben**: Um Trainingsdaten in das "Trainings"-Sheet zu speichern

Die Berechtigungen gelten nur für Spreadsheets in Ihrem eigenen Google Drive.

## 🐛 Troubleshooting

### "Google API nicht geladen"
- Überprüfen Sie Ihre Internetverbindung
- Stellen Sie sicher, dass die Google API Scripts im `index.html` geladen werden
- Warten Sie einen Moment nach dem Laden der Seite

### "Nicht authentifiziert"
- Klicken Sie erneut auf den Sync-Button
- Erlauben Sie Pop-ups für diese Website
- Löschen Sie den Browser-Cache und versuchen Sie es erneut

### "Fehler beim Laden der Übungen"
- Überprüfen Sie die Spreadsheet-ID
- Stellen Sie sicher, dass ein Sheet namens "Übungen" existiert
- Überprüfen Sie, ob das Sheet Daten in Spalte A enthält

### "Synchronisierung fehlgeschlagen"
- Überprüfen Sie, ob ein Sheet namens "Trainings" existiert
- Stellen Sie sicher, dass Sie Schreibrechte für das Spreadsheet haben
- Überprüfen Sie die Browser-Console auf detaillierte Fehlermeldungen

## 📋 Beispiel-Spreadsheet

Sie können dieses [Beispiel-Spreadsheet](https://docs.google.com/spreadsheets/d/1234567890abcdef/edit) als Vorlage verwenden:
1. Öffnen Sie das Beispiel
2. Datei → Kopie erstellen
3. Verwenden Sie die ID Ihrer Kopie in der App

## 🔒 Sicherheit

- API Keys sollten **niemals** in öffentlichen Repositories committet werden
- Verwenden Sie `.env`-Dateien für lokale Entwicklung
- Für Produktion: Verwenden Sie sichere Umgebungsvariablen
- OAuth-Token werden lokal im Browser gespeichert
- Keine Trainingsdaten werden an Drittserver gesendet
