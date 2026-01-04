# Data Flow Architecture - Hill Fitness Sheets

## ✅ React Context Architecture (Updated)

**All app state is now managed through `AppContext`**, providing a centralized, reactive data layer with automatic re-renders across all components.

## Architecture Pattern

```
main.tsx → AppProvider
    ↓
AppContext (exercises, sessions, settings)
    ↓
Components use: useApp() hook
```

### Benefits
- **Single source of truth**: All data in one context
- **Automatic re-renders**: State changes propagate instantly
- **No prop drilling**: Direct context access
- **Persistent storage**: useKV provides localStorage sync
- **Offline-first**: Changes persist automatically

## Data Flow

### 1. Import (XLSX → App)

```mermaid
flowchart TB
    A1[User uploads XLSX] --> A2[SettingsDialog.handleFileUpload]
    A2 --> A3[loadFromXLSX in AppContext]
    A3 --> A4[parseXLSX: Parse file]
    A4 --> A5[setExercises - triggers re-render]
    A4 --> A6[setSessions - triggers re-render]
    A4 --> A7[setSettings with metadata]
    A2 --> A8[Convert file to Base64]
    A8 --> A9[Save settings.importedFile]
    A5 --> A10[All components re-render]
    A6 --> A10
```

### 2. Auto-Load on Startup

```mermaid
flowchart TB
    B1[AppProvider mounts] --> B2{settings.importedFile exists?}
    B2 -->|No| B5[Empty state]
    B2 -->|Yes| B3{exercises empty?}
    B3 -->|Yes| B4[useEffect: parseXLSX on importedFile]
    B4 --> B6[setExercises & setSessions]
    B6 --> B10[Components render with data]
    B3 -->|No| B7{sessions exist?}
    B7 -->|Yes| B8[useEffect: updateXLSXWithSessions]
    B8 --> B9[setSettings updates importedFile]
    B7 -->|No| B10
```

### 3. Recording Training

```mermaid
flowchart TBcompletes workout] --> C2[TrainingEntryView.onComplete]
    C2 --> C3[completeEntry in AppContext]
    C3 --> C4[setSessions updates state]
    C4 --> C5[useEffect detects sessions change]
    C5 --> C6[updateXLSXWithSessions auto-runs]
    C6 --> C7[setSettings updates importedFile]
    C4 --> C8[All components re-render with new session]
    C7 --> C8[Save sessions to useKV]
```

### 4. Export

```mermaid
flowchart TB
    D1[User clicks Export] --> D2[Load settings.importedFile.data Base64]
    D2 --> D3[Convert to ArrayBuffer]
    D3 --> D4[Create Blob]
    D4 --> D5[Download as XLSX file]
    
    style D5 fill:#90ee90
```

**Note:** The exported XLSX contains an additional **"History" Sheet** with all training data in tabular form (Date | Exercise | Weight | Reps | Set).
Component Data Access

Components access data via the `useApp()` hook:

```tsx
import { useApp } from '@/contexts/AppContext'

function MyComponent() {
  const { exercises, sessions, settings, completeEntry } = useApp()
  
  // All data is reactive - changes trigger re-renders
  return <div>{exercises.length} exercises</div>
}
```

### Component Hierarchy

```
AppProvider [provides context]
└─ App.tsx [consumes: exercises, sessions, settings, completeEntry, updateEntry]
   ├─ SessionHeader [props: session, allSessions]
   ├─ SettingsDialog [consumes: settings, setSettings, loadFromXLSX]
   ├─ ExerciseList [props: exercises, currentSession, allSessions]
   └─ TrainingEntryView [props: exercise, currentSession, allSessions]
```

## 
## useKV Keys Used

| Key | Type | Description |
|-----|-----|--------------|
| `settings` | AppSettings | Contains defaultSetsPerExercise + **importedFile** (Base64 XLSX) + Metadata (trainingGoal, legalNotice, notes) |
| `exercises` | Exercise[] | List of all exercises (parsed from XLSX) |
| `sessions` | Session[] | All training sessions with sets (synchronized to XLSX) |

## Core Functions (lib/utils.ts)

## Synchronization Flow

**Context-driven automatic sync:**

```mermaid
sequenceDiagram
    participant User
    participant UI as TrainingEntryView
    participant Context as AppContext
    participant Effect as useEffect
    participant Utils as updateXLSXWithSessions
    participant Storage as useKV

    User->>UI: Records set
    UI->>Context: completeEntry(entry)
    Context->>Context: setSessions(updatedSessions)
    Context->>Storage: useKV auto-saves
    Storage-->>Effect: sessions changed
    Effect->>Utils: updateXLSXWithSessions()
    Utils-->>Effect: New XLSX Base64
    Effect->>Context: setSettings(updated importedFile)
    Context->>Storage: useKV auto-saves settings
    Context-->>UI: All components re-render
```

## Key Implementation Files

- **[AppContext.tsx](src/contexts/AppContext.tsx)**: Central state + business logic
- **[App.tsx](src/App.tsx)**: Main app shell
- **[SettingsDialog.tsx](src/components/SettingsDialog.tsx)**: Import/export UI
- **[utils.ts](src/lib/utils.ts)**: XLSX parsing/writing
- **[types.ts](src/lib/types.ts)**: TypeScript definitions

## Architecture Benefits

✅ **Centralized state**: All data in AppContext  
✅ **Automatic re-renders**: Context propagates changes instantly  
✅ **No prop drilling**: Direct context access via useApp()  
✅ **Offline-capable**: All data in useKV/localStorage  
✅ **Single Source of Truth**: XLSX in localStorage  
✅ **Persistence**: Data survives reload  
✅ **Export anytime**: Current XLSX downloadable  

## Data Flow Diagram (Updated)

```mermaid
graph TB
    subgraph Context["AppContext (React Context)"]
        STATE["Context State:<br/>exercises, sessions, settings"]
    end
    
    subgraph Storage["useKV (localStorage)"]
        XLSX["settings.importedFile<br/>(Base64 XLSX + History Sheet)<br/>⭐ Single Source of Truth"]
        META["settings.metadata<br/>(trainingGoal, legalNotice, notes)"]
        EX["exercises<br/>(parsed)"]
        SESS["sessions<br/>(parsed + runtime updates)"]
    end
    
    STATE -->|auto-sync| EX
    STATE -->|auto-sync| SESS
    STATE -->|auto-sync| XLSX
    
    EX -->|useKV| STATE
    SESS -->|useKV| STATE
    XLSX -->|useKV| STATE
    
    SESS -->|useEffect triggers| XLSX
    
    style STATE fill:#4a9eff,stroke:#333,stroke-width:3px,color:#fff
    style XLSX fill:#ff8c42,stroke:#333,stroke-width:3px,color:#000
    style Context fill:#1a1a1a,stroke:#666,stroke-width:2px
    style Storage fill:#2a2a2a,stroke:#666,stroke-width:2px
```

## Synchronization*Offline-capable**: All data in useKV/localStorage  
✅ **Single Source of Truth**: XLSX in localStorage  
✅ **Persistence**: Data survives reload  
✅ **Export anytime**: Current XLSX can be exported  
✅ **No duplication**: One central parseXLSX function  
✅ **Automatic loading**: XLSX loaded automatically on startup

## Data Flow Diagram

```mermaid
graph TB
    subgraph Storage["useKV (localStorage)"]
        XLSX["settings.importedFile<br/>(Base64 XLSX + History Sheet)<br/>⭐ Single Source of Truth"]
        META["settings.metadata<br/>(trainingGoal, legalNotice, notes)"]
        EX["exercises<br/>(parsed)"]
        SESS["sessions<br/>(parsed + runtime updates)"]
        
        XLSX -->|parseXLSX read| EX
        XLSX -->|parseXLSX read| META
        XLSX -->|parseXLSX read| SESS
        SESS -->|updateXLSXWithSessions write| XLSX
    end
    
    style XLSX fill:#ff8c42,stroke:#333,stroke-width:3px,color:#000
    style SESS fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style Storage fill:#2a2a2a,stroke:#666,stroke-width:2px
```
