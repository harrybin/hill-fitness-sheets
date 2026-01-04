# E2E Tests

Dieses Verzeichnis enthält End-to-End (E2E) Tests für die Hill Fitness Sheets App mit Playwright.

## Tests ausführen

```bash
# Alle E2E-Tests ausführen
npm run test:e2e

# Tests mit UI ausführen
npm run test:e2e:ui

# Tests im Debug-Modus
npm run test:e2e:debug
```

## Test-Dateien

### `exercise-weight-display.spec.ts`

Testet die korrekte Anzeige von Gewichtswerten in den IncompleteExerciseCard-Komponenten.

**Testfälle:**
1. **should display previous weights in incomplete exercise cards**
   - Lädt die Example-Sheet.xlsx
   - Prüft, dass alle nicht abgeschlossenen Übungen ihre vorherigen Gewichtswerte anzeigen
   - Verifiziert die korrekte Position (rechts oben in der Karte)

2. **completed exercises should not show weight in absolute position**
   - Schließt eine Übung ab
   - Prüft, dass abgeschlossene Übungen die Gewichte inline mit den Sets anzeigen

3. **weight display should persist after page reload**
   - Prüft, dass Gewichte nach dem Neuladen der Seite (aus localStorage) weiterhin angezeigt werden

## Konfiguration

Die Playwright-Konfiguration befindet sich in `playwright.config.ts` im Root-Verzeichnis.
