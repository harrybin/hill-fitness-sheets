# AI Agent Instructions for Hill Fitness Sheets

## Project Overview

Hill Fitness Sheets is a Progressive Web App for tracking gym training sessions with offline-first functionality and Google Sheets synchronization. The app prioritizes quick data entry during workouts with large touch targets and minimal UI friction.

**Key Quality Attributes**: Offline-capable, workout-optimized (speed), reliable data sync

## Architecture Fundamentals

### State Management

- **Storage**: Spark KV (localStorage wrapper) via `useKV` hook - exercises, sessions, settings
- **Pattern**: Sync-on-change to XLSX when using local file import; async Google Sheets API for online sync
- **Session Structure**: Organized by date (`YYYY-MM-DD`), contains Exercise IDs and TrainingSets
- **Data Flow**: ExerciseList → TrainingEntryView → App.tsx state handlers → localStorage/XLSX

### Core Data Models ([src/lib/types.ts](src/lib/types.ts))

- `Exercise`: id, name, notes, order
- `TrainingSet`: setNumber (1-based), weight, reps
- `TrainingEntry`: exerciseId, date, sets[]
- `Session`: date string, entries[]
- `AppSettings`: defaultSetsPerExercise, googleSheetId, importedFile (base64 XLSX data)

### UI Component Library

- **Radix UI** for accessible primitives (Dialog, Button, Card, Badge, etc.)
- **Tailwind CSS** with custom theme (dark background, orange accents)
- **Phosphor Icons** for exercise/sync/settings controls
- **Sonner** for toast notifications
- **Responsive**: Single column mobile, sticky headers, 48px minimum touch targets

## Critical Integration Points

### Google Sheets Sync ([src/lib/googleSheets.ts](src/lib/googleSheets.ts))

**Reference Files**:

- [Example sheet for parsing/import/export reference](Example-Sheet.xlsx)
- [Visual representation of expected sheet structure](Example-Sheet-image.png)

**Sheet Structure Requirements**:

The Google Sheets workbook uses multiple sheets (e.g., "Einheit 1-8", "Einheit 9-16", "Einheit 17-24") where each sheet is a continuation of the previous, providing more columns for additional training sessions:

**Per-Sheet Layout**:

- **Column A**: Nr (exercise number/ID)
- **Column B**: Übungen (exercise name) - required for parsing
- **Column C**: Notiz (notes/instructions, e.g., "Achse 1 Fußteller", "enger Griff")
- **Column D**: WH-Zahl (rep range, e.g., "10-12", "12-15")
- **Column E**: Sätze (Set indicator: "Satz 1", "Satz 2")
- **Columns F+**: Training sessions (Einheit 1, 2, 3...) as column pairs:
  - Each session has 2 columns: **WH** (reps performed) | **KG** (weight used)
  - Each exercise spans 2 rows (Satz 1 and Satz 2)

**Exercise Detection**:

- Searches first 20 rows for headers containing "Nr/Übung", "Number/Exercise", or "Muskel"
- Auto-detects whether Column A is numeric ID (then B=name, C=notes) or name directly
- All sheets across the workbook contain the same exercises in the same order
- Sheets 2, 3, etc. are simply continuations providing space for more training sessions

**App-Generated Output** (for "Trainings" sheet):

- Simple columnar format: `Datum | Übung | Satz 1 Gewicht (kg) | Satz 1 Wiederholungen | Satz 2 Gewicht (kg) | ...`
- One row per exercise per session, sorted by date descending

**Three methods for exercise import/export**:

1. **OAuth API Sync** (fast, online-dependent):
   - `fetchExercisesFromSheet()` - Reads "Übungen" sheet (col A=name, B=notes)
   - `syncSessionsToSheet()` - Appends training data to "Trainings" sheet with dynamic headers
   - Requires: VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY environment variables
2. **XLSX Import** (via download):

   - `downloadSheetAsXLSX()` - Fetches spreadsheet as binary, stores in settings.importedFile as base64
   - `importExercisesFromXLSX()` - Parses XLSX, auto-detects exercise headers ("Übung"/"Exercise"/"Muskel")
   - Handles both "Nr/Übungen" and direct name structures

3. **Local XLSX Upload**:
   - User uploads file → parsed via `parseXLSX()` in [src/lib/utils.ts](src/lib/utils.ts)
   - Auto-loads exercises and existing sessions from file
   - Sessions sync back to XLSX on entry completion via `updateXLSXWithSessions()`

**Important**: All XLSX operations convert to/from base64 to store in localStorage. Header detection is critical—must check for common German/English variations.

## Developer Workflows

### Build & Development

```bash
npm run dev          # Start Vite dev server (port 5000)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint check
npm run kill         # Kill process on port 5000 (Mac/Linux)
```

### Key Files by Responsibility

- **App State**: [src/App.tsx](src/App.tsx) - manages exercises, sessions, settings; handles entry completion/updates
- **Exercise Selection**: [src/components/ExerciseList.tsx](src/components/ExerciseList.tsx) - lists exercises with previous workout data
- **Data Entry**: [src/components/TrainingEntryView.tsx](src/components/TrainingEntryView.tsx) - set logging, +/- weight/rep controls
- **Settings & Sync**: [src/components/SettingsDialog.tsx](src/components/SettingsDialog.tsx) - OAuth login, sheet ID input, file upload
- **Sync Controls**: [src/components/SyncButton.tsx](src/components/SyncButton.tsx) - triggers Google Sheets API or XLSX download

## Project-Specific Patterns

### Session Management

- **Today's session**: Derived from `new Date().toISOString().split('T')[0]`; auto-created on first entry
- **Previous training lookup**: Filters allSessions by date, finds last occurrence of exercise (not today)
- **Entry merging**: If exerciseId exists in session, update; else append

### XLSX Handling

- **Parsing**: Uses SheetJS (`xlsx` library); detects header rows via keyword matching
- **Writing**: Clears range, rebuilds with headers + data rows (sorted by date desc)
- **Base64 encoding**: Required for localStorage; encoded in settings.importedFile.data

### Error Handling

- Google API errors throw with German messages (e.g., "Nicht authentifiziert")
- XLSX parse errors caught in `App.tsx` auto-load effect; logged but don't break app
- Sync failures toast notifications via Sonner

## Configuration & Environment

- **Vite config**: Path alias `@` → `src/`; Tailwind + Spark plugins enabled
- **Environment vars**: VITE_GOOGLE_API_KEY, VITE_GOOGLE_CLIENT_ID (for OAuth)
- **Tailwind**: Custom theme in [theme.json](theme.json) - orange accent (0.70 0.17 45), dark gray surfaces
- **TypeScript**: Strict mode enabled, minimal any usage

## When Adding Features

1. **Offline compatibility first**: Data changes must save to localStorage/XLSX immediately
2. **Touch-optimized**: Buttons ≥48px height, avoid hover-only states
3. **German language defaults**: UI strings use German; detect English in sheet imports
4. **Type safety**: Use existing types from [src/lib/types.ts](src/lib/types.ts); extend as needed
5. **Session consistency**: Always check/create today's session before modifying entries

## Debugging & Testing with Browser Tools

### Using Simple Browser for Quick Previews

When debugging UI issues or verifying changes:

1. **Start dev server** if not running: Use the "🚀 dev" task (runs on port 5000)
2. **Open Simple Browser**: Use `open_simple_browser` tool with URL `http://localhost:5000`
3. **Advantages**: Fast preview without leaving VS Code; ideal for quick visual checks

### Using Playwright MCP for Interactive Debugging

For complex interactions, testing user flows, or investigating runtime issues:

**Initial Setup**:

- `browser_navigate` - Navigate to `http://localhost:5000`
- `browser_snapshot` - Capture accessibility tree (better than screenshots for actions)
- `browser_console_messages` - Check for console errors/warnings
- `browser_network_requests` - Inspect API calls, XLSX downloads, Google Sheets requests

**Interactive Testing**:

- `browser_click` - Click buttons, exercise cards, settings icons (requires element ref from snapshot)
- `browser_type` - Fill input fields (exercise names, Google Sheet ID, etc.)
- `browser_fill_form` - Fill multiple form fields at once
- `browser_select_option` - Interact with select dropdowns
- `browser_wait_for` - Wait for dynamic content (e.g., after sync operations)

**Debugging Workflows**:

1. **UI Verification**: snapshot → click/type → snapshot → verify changes
2. **Error Investigation**: console_messages → network_requests → evaluate JavaScript
3. **Sync Testing**: navigate → fill_form (sheet ID) → click (sync button) → wait_for → network_requests
4. **Mobile Responsiveness**: `browser_resize` to test different viewport sizes (e.g., 375x667 for mobile)

**Best Practices**:

- Always call `browser_snapshot` before interactive commands to get current element refs
- Use `browser_console_messages` and `browser_network_requests` to diagnose failures
- For screenshot documentation: `browser_take_screenshot` with filename parameter
- Handle dialogs with `browser_handle_dialog` (OAuth popups, alerts)
- Use `browser_evaluate` to inspect localStorage state or run custom JS

**Example Debug Flow**:

```
1. browser_navigate → http://localhost:5000
2. browser_snapshot → Identify exercise list, settings button
3. browser_console_messages → Check for JavaScript errors
4. browser_click → Open settings (using ref from snapshot)
5. browser_type → Enter Google Sheet ID
6. browser_click → Save settings
7. browser_network_requests → Verify Google Sheets API call
8. browser_console_messages → Confirm no errors
```

### When to Use Each Tool

- **Simple Browser**: Quick visual checks, CSS/layout verification, rapid iteration
- **Playwright MCP**: Multi-step user flows, debugging sync issues, testing offline functionality, verifying touch targets, investigating console errors or network failures
