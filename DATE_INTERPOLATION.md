# Date Interpolation Feature

## Overview
Implemented automatic date interpolation for training sessions (Einheiten) that lack explicit date values. When Einheit columns are missing dates, the parser now automatically calculates and assigns dates evenly distributed between known date points.

## How It Works

### Algorithm
1. **Collect Sessions**: Parse all training session columns and their associated dates
2. **Identify Gaps**: Find sequences of undated sessions between dated ones
3. **Interpolate Dates**: 
   - Between two dated sessions: distribute dates evenly across the time span
   - At start (undated before first dated): work backwards from the first dated session
   - At end (undated after last dated): use today's date
   - No dates at all: assign all sessions today's date

### Example
```
Input sheet structure:
Einheit 1 (18.11.25) → Einheit 2 (blank) → Einheit 3 (blank) → Einheit 4 (21.11.25)

Output dates:
Einheit 1: 2025-11-18 (explicit)
Einheit 2: 2025-11-19 (interpolated)
Einheit 3: 2025-11-20 (interpolated)
Einheit 4: 2025-11-21 (explicit)
```

## Implementation

### Function: `interpolateSessionDates()`
- **Location**: [src/lib/utils.ts](src/lib/utils.ts) (lines ~530-608)
- **Input**: Array of training sessions with optional date values
- **Output**: Array of training sessions with all dates populated

### Key Features
- Handles all edge cases:
  - Consecutive undated sessions between two dates
  - Undated sessions at the beginning
  - Undated sessions at the end
  - All sessions undated (fallback to today)
- Uses ISO-8601 date format (YYYY-MM-DD)
- Minimum interval of 1 day between interpolated dates
- Linear distribution for even spacing

### Integration
Called in `parseSessionsFromSheet()` after detecting raw training sessions:
```typescript
const sessionsWithInterpolatedDates = interpolateSessionDates(trainingSessions);
```

## Test Coverage

### New Tests in `utils.sessions.test.ts`:
1. **should interpolate dates between two dated sessions**
   - Tests core interpolation with explicit boundary dates
   
2. **should handle single dated session surrounded by undated ones**
   - Tests robustness with asymmetric date distribution
   
3. **should create sessions with proper spacing when dates are interpolated**
   - Tests chronological ordering and spacing logic

### Test Results
```
✓ 73 tests passing (70 original + 3 new)
✓ All date formats supported (ISO, German DD.MM.YYYY, US MM/DD/YYYY, Excel serial)
✓ Multi-sheet continuation handled correctly
✓ Export/import roundtrip fidelity maintained
```

## User-Facing Impact

### Before
Users manually assigned dates to each training session or copied dates down

### After
- Parse XLSX → **Automatically fill missing Einheit dates**
- Dates evenly distributed across the range
- Clean, chronological session history without gaps

## Configuration
No additional configuration required. The feature automatically activates for any XLSX import with training data.

## Backward Compatibility
✓ Fully compatible with existing sheets  
✓ All existing tests continue to pass  
✓ No API changes  
✓ Date handling unchanged for explicitly dated sessions
