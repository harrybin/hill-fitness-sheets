## For Developers

A Progressive Web App for tracking gym training sessions with offline-first functionality and Google Sheets synchronization.

## Features

- **Offline-First**: Track workouts even without internet connection; data syncs when back online
- **Quick Data Entry**: Optimized UI for fast logging during workouts with large touch targets (48px minimum)
- **Google Sheets Integration**: Sync exercises and training data to Google Sheets via OAuth API or XLSX import/export
- **XLSX Support**: Import exercises from Excel files and sync training sessions back to spreadsheets
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop with minimal UI friction
- **Dark Theme**: Easy on the eyes during workouts with orange accent colors

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5000` by default.

### Build for Production

```bash
npm run build
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - TypeScript check + production build
- `npm run lint` - Run ESLint checks
- `npm run kill` - Kill process on port 5000 (Mac/Linux)

## Usage

### Adding Exercises

1. Go to **Settings** (gear icon)
2. Choose one of three methods:
   - **OAuth Google Sheets**: Sign in with Google to import exercises from "Übungen" sheet
   - **XLSX Download**: Download spreadsheet as file and import
   - **Manual Upload**: Upload a local Excel file with exercises

### Tracking Workouts

1. Select an exercise from the list
2. Log sets with weight and reps using the +/- controls
3. Data auto-saves to device storage
4. Complete the entry to move to the next exercise

### Syncing Data

- **Google Sheets**: Press sync button to upload today's sessions to "Trainings" sheet
- **XLSX**: Download updated spreadsheet with all training data

## Project Structure

```
src/
├── App.tsx                 # Main app state and session management
├── components/
│   ├── ExerciseList.tsx   # Exercise selection with previous workout data
│   ├── TrainingEntryView.tsx  # Set logging interface
│   ├── SettingsDialog.tsx  # Configuration and sync options
│   ├── SyncButton.tsx      # Manual sync trigger
│   ├── SessionHeader.tsx   # Today's date and session info
│   └── ui/                 # Radix UI component library
├── hooks/
│   └── use-mobile.ts       # Mobile device detection
└── lib/
    ├── googleSheets.ts     # Google Sheets API integration
    ├── types.ts            # TypeScript type definitions
    └── utils.ts            # XLSX parsing and utility functions
```

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Phosphor Icons** - Icon library
- **Sonner** - Toast notifications
- **SheetJS** - XLSX parsing and generation
- **Spark KV** - localStorage wrapper for state management

## Data Models

- **Exercise**: ID, name, notes, display order
- **TrainingSet**: Set number, weight, reps
- **TrainingEntry**: Exercise ID, date, array of sets
- **Session**: Date string, array of training entries
- **AppSettings**: Default sets per exercise, Google Sheet ID, imported XLSX data

## Configuration

### Environment Variables

Create a `.env.local` file with:

```
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_API_KEY=your_api_key
```

See [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) for detailed OAuth configuration.

### Theme Customization

Edit `theme.json` to customize colors. Current theme uses:
- Dark gray surfaces
- Orange accents (hsl 0.70 0.17 45)
- High contrast for readability

## Documentation

- [PRD.md](PRD.md) - Product requirements and feature specification
- [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) - Google Sheets OAuth setup guide
- [DATENHALTUNG.md](DATENHALTUNG.md) - Data storage and persistence (German)
- [SECURITY.md](SECURITY.md) - Security considerations

## License

MIT
