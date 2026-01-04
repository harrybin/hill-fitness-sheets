# Datenhaltung - Gym Tracker

Die App verwendet die importierte XLSX-Datei im Local 

Die App verwendet die importierte XLSX-Datei im Local Storage als **Single Source of Truth** für alle Daten.

## Architektur

- **Historisc
Beim Import einer XLSX-Datei:
- Datei wird in Base64 kodiert und in `settings.importedFile` gespeichert
- Übungen werden aus dem Hauptsheet extrahiert
- **Historische Trainingsdaten** werden aus dem "Training History" Sheet geladen (falls vorhanden)
- Alle Daten werden in den KV-Store geschrieben

### 2. Training erfassen
## XLSX-Struktur
### Sheet 1: Übungsliste (Original-Sheet)
Nr. | Übungen          | Notizen
2   | Kniebeugen       | ...

```
2024-01-15 |
2024-01-15 | Kniebeugen     | 1    | 100         | 12


Import XLSX
Local Storage (Bas
Parse → Übungen + History
KV-Store (exercises + sessions)
Training erfassen

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
