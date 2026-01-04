# Planning Guide

A Progressive Web App for tracking gym training sessions that syncs with Google Sheets, optimized for quick data entry during workouts with offline-first functionality.

**Experience Qualities**: 
1. **Efficient** - Large touch targets and minimal taps to log exercises during active workouts
2. **Reliable** - Fully functional offline with background sync when connection returns
3. **Focused** - Distraction-free interface that shows only essential training data

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused workout tracking tool with exercise selection, set logging, and Google Sheets sync. It manages local state with offline persistence and periodic cloud synchronization.

## Essential Features

### Exercise Selection
- **Functionality**: Display list of exercises imported from Google Sheets with previous workout data
- **Purpose**: Quick access to all configured exercises with historical context
- **Trigger**: User starts new training session or continues active session
- **Progression**: Open app → View exercise list with last weights/reps → Tap exercise → Enter training data
- **Success criteria**: All exercises from spreadsheet visible, shows last recorded weight and reps

### Set Entry with Quick Adjustments
- **Functionality**: Log weight and reps with large +/- buttons for ±2-3 rep adjustments
- **Purpose**: Fast one-handed data entry during workout without typing
- **Trigger**: User selects exercise from list
- **Progression**: Select exercise → Pre-filled previous values shown → Tap weight +/- buttons → Tap rep adjustment buttons → Confirm set → Auto-advance to next set
- **Success criteria**: Can complete set entry in 2-3 taps, values auto-populate from previous training

### Automatic Set Management
- **Functionality**: Track default 2 sets per exercise (configurable in settings)
- **Purpose**: Streamline workflow by automatically managing set counts
- **Trigger**: Exercise selected and first set logged
- **Progression**: Complete Set 1 → Auto-advance to Set 2 entry → Complete Set 2 → Return to exercise list
- **Success criteria**: Correct number of sets tracked per exercise, clear visual indication of current set

### Session Date Tracking
- **Functionality**: Automatically timestamp training sessions when started
- **Purpose**: Maintain chronological training history
- **Trigger**: First exercise logged in new session
- **Progression**: Log first set → Session auto-stamped with current date → All subsequent exercises tagged to session
- **Success criteria**: Each training session has unique date, cannot create duplicate sessions for same day

### Google Sheets Sync
- **Functionality**: Direct Google Sheets API integration to import exercise templates and export completed training data with OAuth2 authentication
- **Purpose**: Centralized training plan management and history in user's own Google Drive
- **Trigger**: Manual sync button with authentication flow or direct sync when authenticated
- **Progression**: User enters Sheet ID in settings → Clicks sync → Google OAuth login (first time) → Fetch exercises from "Übungen" sheet → Upload training data to "Trainings" sheet → Confirm sync success with counts
- **Success criteria**: Spreadsheet structure maintained (Übungen: A=Name, B=Notes; Trainings: auto-generated with dates and sets), exercises imported successfully, all sessions exported with proper formatting, OAuth token persisted for subsequent syncs

### Offline-First Architecture
- **Functionality**: Full app functionality without internet connection
- **Purpose**: Gym environments often have poor connectivity
- **Trigger**: App loads or loses connection
- **Progression**: App loads → All data from local storage → User works offline → Connection returns → Auto-sync in background
- **Success criteria**: Zero functionality loss offline, sync queue persists until successful upload

## Edge Case Handling

- **No Previous Data**: First-time exercises show 0kg/0 reps as starting point with clear "New Exercise" indicator
- **Sync Conflicts**: Last-write-wins strategy with timestamp comparison, user notified of conflicts
- **Partial Sets**: Save in-progress sets automatically, allow resuming incomplete sessions
- **Connection Loss During Sync**: Queue failed uploads, retry with exponential backoff, show sync status
- **Invalid Spreadsheet Format**: Validate structure on import, show clear error messages with expected format
- **Settings Changes Mid-Session**: Apply new set counts only to future sessions, preserve current session config

## Design Direction

Industrial fitness aesthetic with high contrast and bold interaction elements. The design should feel like professional gym equipment - purposeful, robust, and no-nonsense. Focus on readability in various lighting conditions (bright gym lights, outdoor areas) and effortless one-handed operation.

## Color Selection

Gray/black/white foundation with orange as the energetic accent color, inspired by industrial gym equipment and high-visibility athletic gear.

- **Primary Color**: Orange `oklch(0.70 0.17 45)` - Energy, action, and achievement. Used for primary buttons and active states to drive user action.
- **Secondary Colors**: 
  - Dark Gray `oklch(0.25 0 0)` - Main surfaces and cards, creates depth
  - Medium Gray `oklch(0.50 0 0)` - Secondary UI elements, borders
  - Light Gray `oklch(0.85 0 0)` - Muted backgrounds, disabled states
- **Accent Color**: Vibrant Orange `oklch(0.70 0.17 45)` - Call-to-action buttons, active exercise, completed sets
- **Foreground/Background Pairings**: 
  - Background (Near Black #1a1a1a `oklch(0.15 0 0)`): White text `oklch(0.98 0 0)` - Ratio 13.8:1 ✓
  - Dark Gray Cards `oklch(0.25 0 0)`: White text `oklch(0.98 0 0)` - Ratio 9.2:1 ✓
  - Orange Accent `oklch(0.70 0.17 45)`: Black text `oklch(0.15 0 0)` - Ratio 7.3:1 ✓
  - Light Gray Muted `oklch(0.85 0 0)`: Dark Gray text `oklch(0.25 0 0)` - Ratio 5.1:1 ✓

## Font Selection

Bold, legible typefaces optimized for quick scanning and large numerical displays during active workouts.

- **Primary Font**: Space Grotesk - Technical athletic aesthetic with excellent readability, strong numerical characters
- **Secondary Font**: JetBrains Mono - For weight/rep numbers, monospaced clarity

- **Typographic Hierarchy**: 
  - H1 (Exercise Name): Space Grotesk Bold/24px/tight tracking - Maximum impact
  - H2 (Section Headers): Space Grotesk SemiBold/18px/normal - Clear hierarchy
  - Body (Labels): Space Grotesk Regular/16px/relaxed - Comfortable reading
  - Numbers (Weight/Reps): JetBrains Mono Bold/32px/tight - Large, scannable digits
  - Small (Meta info): Space Grotesk Regular/14px/normal - Supporting details

## Animations

Minimal, purposeful animations that provide feedback without delaying actions. Fast, snappy transitions that feel responsive to touch.

- **Set Completion**: Quick scale + fade animation (150ms) when confirming set with subtle success feedback
- **Exercise Selection**: Smooth slide transition (200ms) from list to entry screen
- **Button Press**: Immediate visual feedback (100ms) with subtle press-down effect
- **Sync Status**: Gentle pulse on sync icon during upload, checkmark animation on completion
- **No delays**: All animations complete under 300ms, user can interrupt any animation

## Component Selection

- **Components**: 
  - Card - Exercise list items with prominent tap targets
  - Button - Large touch-optimized +/- controls and primary actions (variant: default for primary, outline for secondary)
  - Badge - Set indicators (1/2, 2/2) and sync status
  - Dialog - Settings panel and sync configuration
  - Separator - Visual grouping between exercises
  - Progress - Set completion indicator
  - Skeleton - Loading states during sync
  - Toast (Sonner) - Sync confirmations and error notifications
  
- **Customizations**: 
  - Oversized number buttons (min 60px height) for weight/rep adjustments
  - Custom exercise card with integrated previous workout data display
  - Sync status indicator with offline queue count
  - Session header with date and exercise completion count
  
- **States**: 
  - Buttons: Distinct hover (subtle glow), active (pressed down), disabled (low opacity), loading (spinner)
  - Exercise cards: Default, selected/active, completed (checkmark), partially complete
  - Inputs: Focus state with orange ring, error state with red border
  
- **Icon Selection**: 
  - Plus/Minus (weight/rep adjustments) - Phosphor icons
  - ArrowsClockwise (sync) - Clear sync action
  - Gear (settings) - Standard settings icon
  - CheckCircle (completed sets) - Visual completion feedback
  - CloudSlash (offline mode) - Connection status
  - Barbell/Activity (exercise categories) - Context icons
  
- **Spacing**: 
  - Card padding: p-6 (24px) for comfortable touch targets
  - Button gaps: gap-4 (16px) between action buttons
  - Section margins: mb-6 (24px) between major sections
  - Minimum touch target: 48px height for all interactive elements
  
- **Mobile**: 
  - Single column layout on mobile (<768px)
  - Fixed bottom action bar for primary actions
  - Sticky header with session info
  - Full-width cards with generous padding
  - Bottom sheet for settings instead of modal dialog
  - Swipe gestures for navigation between exercises
  - Large tap targets (minimum 48x48px) for all interactive elements
