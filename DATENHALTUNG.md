# Datenhaltung - Gym Tracker

## ✅ Single Source of Truth

Die XLSX-Datei im Local Storage (useKV) ist die **Single Source of Truth** für alle Daten.

## Datenfluss

### 1. Import (XLSX → App)
```
Benutzer lädt XLSX hoch
  ↓
Datei wird in Base64 konvertiert
  ↓
In settings.importedFile gespeichert (useKV)
  ↓
Übungen werden geparst → exercises (useKV)
  ↓
Training History wird geparst → sessions (useKV)
```

### 2. Auto-Load beim Start
```
App startet
  ↓
settings.importedFile vorhanden?
  ↓ Ja
XLSX aus settings laden
  ↓
Übungen & Sessions in useKV schreiben
```

### 3. Training erfassen
```
Benutzer erfasst Sätze
  ↓
sessions (useKV) wird aktualisiert
  ↓
syncSessionsToXLSX() wird aufgerufen
  ↓
XLSX wird mit neuen Sessions aktualisiert
  ↓
settings.importedFile (useKV) wird aktualisiert
```

### 4. Export
```
Benutzer klickt Export
  ↓
settings.importedFile.data (Base64) wird geladen
  ↓
In ArrayBuffer konvertiert
  ↓
Als XLSX-Datei heruntergeladen
```

## Verwendete useKV Keys

| Key | Typ | Beschreibung |
|-----|-----|--------------|
| `settings` | AppSettings | Enthält defaultSetsPerExercise + **importedFile** (Base64 XLSX) |
| `exercises` | Exercise[] | Liste aller Übungen (aus XLSX geparst) |
| `sessions` | Session[] | Alle Trainingssessions mit Sets (wird in XLSX synchronisiert) |

## Zentrale Funktionen (lib/utils.ts)

### parseXLSX(arrayBuffer)
- Liest XLSX-Datei
- Extrahiert Übungen, Metadata, Sessions
- Returns: `{ exercises, metadata, sessions }`

### updateXLSXWithSessions(xlsxData, sessions, exercises)
- Nimmt aktuelle XLSX-Daten (Base64)
- Aktualisiert "Training History" Sheet mit sessions
- Returns: neue XLSX-Daten (Base64)

### base64ToArrayBuffer(base64)
- Konvertiert Base64 → ArrayBuffer

### arrayBufferToBase64(buffer)
- Konvertiert ArrayBuffer → Base64

## Synchronisation

**Wann wird die XLSX aktualisiert?**
1. Bei jedem Abschluss einer Übung (handleCompleteEntry)
2. Bei jeder Änderung an Sets (handleUpdateEntry)
3. Beim Löschen von Sets

**Wie funktioniert die Sync?**
```typescript
syncSessionsToXLSX(updatedSessions) {
  // Holt aktuelle XLSX aus settings
  // Aktualisiert Training History Sheet
  // Speichert zurück in settings.importedFile
}
```

## Vorteile dieser Architektur

✅ **Offline-fähig**: Alle Daten in useKV/localStorage
✅ **Single Source of Truth**: XLSX im localStorage
✅ **Persistenz**: Daten überleben Neuladen
✅ **Export jederzeit**: Aktuelle XLSX kann exportiert werden
✅ **Keine Duplikation**: Eine zentrale parseXLSX Funktion
✅ **Automatisches Laden**: Beim Start wird XLSX automatisch geladen

## Datenfluss-Diagramm

```
┌─────────────────────────────────────────────────┐
│           useKV (localStorage)                  │
│  ┌──────────────────────────────────────────┐  │
│  │ settings.importedFile (Base64 XLSX)      │  │
│  │  ← Single Source of Truth                │  │
│  └──────────────────────────────────────────┘  │
│                     ↕                           │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  exercises   │  │   sessions   │            │
│  │  (parsed)    │  │  (parsed +   │            │
│  │              │  │   updates)   │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```
