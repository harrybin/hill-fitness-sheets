# Datenhaltung - Gym Tracker

## ✅ Single Source of Truth

Die XLSX-Datei im Local Storage (useKV) ist die **Single Source of Truth** für alle Daten.

## Datenfluss

### 1. Import (XLSX → App)

```mermaid
flowchart TB
    A1[Benutzer lädt XLSX hoch] --> A2[Datei wird in Base64 konvertiert]
    A2 --> A3[In settings.importedFile gespeichert]
    A3 --> A4[Übungen werden geparst]
    A4 --> A5[exercises in useKV]
    A3 --> A6[Training History wird geparst]
    A6 --> A7[sessions in useKV]
```

### 2. Auto-Load beim Start

```mermaid
flowchart TB
    B1[App startet] --> B2{settings.importedFile vorhanden?}
    B2 -->|Ja| B3[XLSX aus settings laden]
    B3 --> B4[Übungen & Sessions in useKV schreiben]
    B2 -->|Nein| B5[Leere Listen]
```

### 3. Training erfassen

```mermaid
flowchart TB
    C1[Benutzer erfasst Sätze] --> C2[sessions useKV aktualisiert]
    C2 --> C3[syncSessionsToXLSX aufgerufen]
    C3 --> C4[XLSX mit neuen Sessions aktualisiert]
    C4 --> C5[settings.importedFile useKV aktualisiert]
```

### 4. Export

```mermaid
flowchart TB
    D1[Benutzer klickt Export] --> D2[settings.importedFile.data Base64 laden]
    D2 --> D3[In ArrayBuffer konvertiert]
    D3 --> D4[Als XLSX-Datei heruntergeladen]
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

```mermaid
sequenceDiagram
    participant User as Benutzer
    participant UI as TrainingEntryView
    participant App as App.tsx
    participant Sync as syncSessionsToXLSX
    participant Storage as useKV

    User->>UI: Erfasst Satz
    UI->>App: handleCompleteEntry(entry)
    App->>Storage: sessions aktualisieren
    App->>Sync: syncSessionsToXLSX(updatedSessions)
    Sync->>Storage: settings.importedFile laden
    Sync->>Sync: XLSX mit Sessions aktualisieren
    Sync->>Storage: settings.importedFile speichern
    Storage-->>App: Bestätigung
```

## Vorteile dieser Architektur

✅ **Offline-fähig**: Alle Daten in useKV/localStorage  
✅ **Single Source of Truth**: XLSX im localStorage  
✅ **Persistenz**: Daten überleben Neuladen  
✅ **Export jederzeit**: Aktuelle XLSX kann exportiert werden  
✅ **Keine Duplikation**: Eine zentrale parseXLSX Funktion  
✅ **Automatisches Laden**: Beim Start wird XLSX automatisch geladen

## Datenfluss-Diagramm

```mermaid
graph TB
    subgraph Storage["useKV (localStorage)"]
        XLSX["settings.importedFile<br/>(Base64 XLSX)<br/>⭐ Single Source of Truth"]
        EX["exercises<br/>(parsed)"]
        SESS["sessions<br/>(parsed + updates)"]
        
        XLSX <-->|parseXLSX| EX
        XLSX <-->|parseXLSX<br/>updateXLSXWithSessions| SESS
    end
    
    style XLSX fill:#ff8c42,stroke:#333,stroke-width:3px,color:#000
    style Storage fill:#2a2a2a,stroke:#666,stroke-width:2px
```
