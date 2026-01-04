# Datenschutzerklärung

**Stand:** 4. Januar 2026

## 1. Verantwortlicher

Diese Datenschutzerklärung gilt für die Progressive Web App "Hill Fitness Sheets" (nachfolgend "App" genannt).

## 2. Grundsätze der Datenverarbeitung

Hill Fitness Sheets wurde mit einem **Privacy-by-Design**-Ansatz entwickelt. Die App verarbeitet alle Ihre Daten ausschließlich **lokal auf Ihrem Gerät**. Es werden **keine Daten auf Servern des App-Herstellers** gespeichert, übertragen oder verarbeitet.

## 3. Art und Umfang der Datenverarbeitung

### 3.1 Lokale Datenspeicherung (localStorage)

**Art der Daten:**
- Übungsdaten (Name, Notizen, Reihenfolge)
- Trainingssessions (Datum, Gewicht, Wiederholungen)
- App-Einstellungen (Standardanzahl Sätze, Google Sheets ID)
- Optional: Importierte XLSX-Dateien (als Base64-kodierte Daten)

**Speicherort:** Alle Daten werden ausschließlich im lokalen Speicher Ihres Browsers (localStorage/IndexedDB) gespeichert.

**Zweck:** Speicherung Ihrer Trainingsdaten zur Nutzung der App-Funktionen, auch offline.

**Rechtsgrundlage:** Ihre Einwilligung durch die aktive Nutzung der App (Art. 6 Abs. 1 lit. a DSGVO).

**Zugriff:** Nur Sie haben Zugriff auf diese Daten auf Ihrem Gerät. Der App-Hersteller hat **keinen Zugriff** auf diese lokal gespeicherten Daten.

**Löschung:** Sie können alle lokal gespeicherten Daten jederzeit durch:
- Löschen der Browser-Daten/localStorage
- Deinstallation der App
- Nutzung der Browser-Entwicklertools

### 3.2 Google Sheets Integration (optional)

Wenn Sie die optionale Google Sheets-Synchronisierung aktivieren:

**Art der Daten:**
- Ihre Trainingsdaten (Übungen, Gewichte, Wiederholungen, Datum)

**Verarbeitung:** Die Daten werden direkt von Ihrem Browser an Ihre persönliche Google Sheets-Tabelle übertragen.

**Datenempfänger:** Google LLC (Google Sheets)

**Zweck:** Synchronisierung und Backup Ihrer Trainingsdaten in Ihrer eigenen Google Sheets-Tabelle.

**Rechtsgrundlage:** Ihre Einwilligung durch die aktive Aktivierung der Synchronisierung (Art. 6 Abs. 1 lit. a DSGVO).

**Wichtig:** 
- Die Daten werden direkt zwischen Ihrem Browser und Google übertragen
- Es erfolgt **keine Übertragung über Server des App-Herstellers**
- Der App-Hersteller hat **keinen Zugriff** auf Ihre Google Sheets-Tabellen
- Die OAuth-Authentifizierung erfolgt direkt mit Google
- Für die Datenverarbeitung bei Google gelten die [Datenschutzbestimmungen von Google](https://policies.google.com/privacy)

**Widerruf:** Sie können die Synchronisierung jederzeit in den App-Einstellungen deaktivieren und die OAuth-Berechtigung in Ihren Google-Kontoeinstellungen widerrufen.

### 3.3 XLSX-Datei-Import/Export (optional)

**Art der Daten:**
- XLSX-Dateien mit Ihren Trainingsdaten

**Verarbeitung:** 
- Import: Die hochgeladene Datei wird lokal im Browser geparst und in localStorage gespeichert
- Export: Ihre lokalen Daten werden als XLSX-Datei heruntergeladen
- Die Dateiverarbeitung erfolgt vollständig in Ihrem Browser

**Zweck:** Import bestehender Trainingspläne oder Export für Backup-Zwecke.

**Rechtsgrundlage:** Ihre Einwilligung durch die aktive Nutzung der Import/Export-Funktion (Art. 6 Abs. 1 lit. a DSGVO).

**Wichtig:** Die Datei-Verarbeitung erfolgt ausschließlich lokal. Es werden **keine Dateien an Server übertragen**.

## 4. Cookies und Tracking

Die App verwendet **keine Cookies** und betreibt **kein Tracking**. Es werden keine Analyse-Tools, Werbe-Dienste oder sonstige Third-Party-Tracker eingesetzt.

## 5. Progressive Web App (PWA) Funktionen

### 5.1 Service Worker

Die App nutzt einen Service Worker für:
- Offline-Funktionalität
- Caching von App-Ressourcen (HTML, CSS, JavaScript)
- Schnellere Ladezeiten

**Wichtig:** Der Service Worker speichert nur technische App-Dateien, keine Nutzerdaten.

### 5.2 App-Installation

Bei Installation der App auf Ihrem Gerät:
- Werden App-Ressourcen lokal gecacht
- Funktioniert die App auch offline
- Es erfolgt **keine Datenübertragung** an externe Server

## 6. Datensicherheit

**Lokale Sicherheit:**
- Ihre Daten sind durch die Sicherheitsmechanismen Ihres Browsers geschützt
- Andere Websites/Apps können nicht auf die localStorage-Daten zugreifen (Same-Origin-Policy)

**Empfehlungen:**
- Nutzen Sie ein sicheres Gerätepasswort/PIN
- Halten Sie Ihren Browser aktuell
- Erstellen Sie regelmäßig Backups (z.B. über Google Sheets oder XLSX-Export)

## 7. Datenlöschung

**Vollständige Löschung aller App-Daten:**
1. In Ihrem Browser: Löschen Sie die Website-Daten/localStorage für die App-Domain
2. Chrome: Einstellungen → Datenschutz und Sicherheit → Website-Einstellungen → Alle Websitedaten anzeigen
3. Firefox: Einstellungen → Datenschutz & Sicherheit → Cookies und Website-Daten → Daten verwalten
4. Safari: Einstellungen → Datenschutz → Website-Daten verwalten

**Google Sheets-Daten:** Löschen Sie selbst die Inhalte in Ihrer Google Sheets-Tabelle.

## 8. Ihre Rechte nach DSGVO

Da alle Daten ausschließlich lokal auf Ihrem Gerät gespeichert werden und der App-Hersteller keinen Zugriff auf Ihre Daten hat, können Sie Ihre Rechte selbstständig ausüben:

- **Auskunft (Art. 15 DSGVO):** Sie können über Browser-Entwicklertools jederzeit Ihre gespeicherten Daten einsehen
- **Berichtigung (Art. 16 DSGVO):** Sie können Daten jederzeit in der App bearbeiten
- **Löschung (Art. 17 DSGVO):** Sie können Daten in der App löschen oder die gesamten Browser-Daten löschen
- **Einschränkung (Art. 18 DSGVO):** Sie können die Nutzung einzelner Funktionen (z.B. Google Sheets-Sync) deaktivieren
- **Datenübertragbarkeit (Art. 20 DSGVO):** Sie können Ihre Daten jederzeit als XLSX-Datei exportieren
- **Widerspruch (Art. 21 DSGVO):** Sie können die Nutzung der App jederzeit beenden

## 9. Keine Weitergabe an Dritte

Der App-Hersteller gibt **keine Daten an Dritte weiter**, da er keinen Zugriff auf Ihre Daten hat.

**Ausnahme:** Wenn Sie die Google Sheets-Synchronisierung aktivieren, werden Daten direkt von Ihrem Browser an Google LLC übertragen (siehe Punkt 3.2).

## 10. Keine Verarbeitung außerhalb der EU

Da die App vollständig lokal in Ihrem Browser läuft, erfolgt **keine Datenübertragung** an Server außerhalb der EU.

**Ausnahme:** Bei Nutzung der Google Sheets-Integration können Daten auf Google-Servern gespeichert werden. Informationen zum Speicherort Ihrer Google-Daten finden Sie in den [Google Cloud-Standorten](https://cloud.google.com/about/locations).

## 11. Minderjährige

Die App richtet sich an Personen ab 16 Jahren. Jüngere Personen sollten die App nur mit Zustimmung ihrer Erziehungsberechtigten nutzen.

## 12. Änderungen dieser Datenschutzerklärung

Diese Datenschutzerklärung kann bei Weiterentwicklung der App angepasst werden. Die aktuelle Version finden Sie immer in der App oder im GitHub-Repository.

## 13. Kontakt

Bei Fragen zum Datenschutz können Sie sich an den Entwickler wenden:

GitHub: https://github.com/harrybin/hill-fitness-sheets

---

**Zusammenfassung:**

✅ Alle Daten werden **nur lokal auf Ihrem Gerät** gespeichert  
✅ **Keine Datenübertragung** an Server des App-Herstellers  
✅ **Keine Cookies oder Tracking**  
✅ Optionale Google Sheets-Sync erfolgt direkt zwischen Ihrem Browser und Google  
✅ Sie haben **volle Kontrolle** über Ihre Daten  
✅ **Privacy by Design** – Datenschutz ist ein Kernelement der App-Architektur
