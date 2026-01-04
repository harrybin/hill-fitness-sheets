# Datenhaltung - Gym Tracker

## Single Source of Truth: XLSX-Datei im Local Storage

Die App verwendet die importierte XLSX-Datei im Local Storage als **Single Source of Truth** für alle Daten.

## Architektur

### 1. Import
Beim Import einer XLSX-Datei:
- Datei wird in Base64 kodiert und in `settings.importedFile` gespeichert
- Übungen werden aus dem Hauptsheet extrahiert
- **Historische Trainingsdaten** werden aus dem "Training History" Sheet geladen (falls vorhanden)
- Alle Daten werden in den KV-Store geschrieben

### 2. Training erfassen
Bei jeder Trainingserfassung:
- Daten werden im KV-Store (`sessions`) aktualisiert
- **Sofort danach** wird die XLSX-Datei im Local Storage aktualisiert
- Ein "Training History" Sheet wird erstellt/aktualisiert mit allen Sessions

### 3. Export
Beim Export:
- Die aktuelle XLSX-Datei aus dem Local Storage wird exportiert
- Diese enthält **alle** aktuellen Übungen und Trainingsdaten

### 4. Synchronisation
Der "Sync" Button:
- Lädt die Daten aus der XLSX-Datei im Local Storage
- Überschreibt die aktuellen Übungen und Sessions im KV-Store
- Nützlich für Reset oder Wiederherstellung

## XLSX-Struktur

### Sheet 1: Übungsliste (Original-Sheet)
```
Nr. | Übungen          | Notizen
1   | Bankdrücken      | 3 Sätze
2   | Kniebeugen       | ...
```

### Sheet 2: Training History (Auto-generiert)
```
Datum      | Übung          | Satz | Gewicht (kg) | Wiederholungen
2024-01-15 | Bankdrücken    | 1    | 80          | 10
2024-01-15 | Bankdrücken    | 2    | 80          | 8
2024-01-15 | Kniebeugen     | 1    | 100         | 12
```

## Datenfluss

```
Import XLSX
    ↓
Local Storage (Base64)
    ↓
Parse → Übungen + History
    ↓
KV-Store (exercises + sessions)
    ↓
Training erfassen
    ↓
Update KV-Store
    ↓
Update XLSX in Local Storage ← SINGLE SOURCE OF TRUTH
    ↓
Export XLSX
```

## Vorteile

1. ✅ **Offline-fähig**: Alle Daten im Local Storage
2. ✅ **Portabel**: Export = komplette Datensicherung
3. ✅ **Bidirektional**: Import und Export mit vollständiger Historie
4. ✅ **Synchronisiert**: XLSX enthält immer aktuelle Trainingsdaten
5. ✅ **Standard-Format**: XLSX kann in Excel/Google Sheets bearbeitet werden

## Wichtige Hinweise

- Die XLSX-Datei wird bei **jedem Training-Update** neu geschrieben
- Das "Training History" Sheet wird automatisch verwaltet
- Beim Re-Import einer XLSX mit History werden alte Trainings wiederhergestellt
- Die Exercise-IDs werden beim Import generiert, daher müssen Exercise-Namen für History-Mapping verwendet werden
